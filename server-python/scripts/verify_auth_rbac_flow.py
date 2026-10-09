from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any, cast

from httpx import ASGITransport, AsyncClient
from redis.asyncio import Redis
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncEngine

from app.core.config import get_settings
from app.core.errors import AppError
from app.core.runtime import RuntimeDependencies
from app.db.enums import UserRole
from app.db.models import User
from app.db.session import create_database_engine, create_session_factory
from app.main import create_app
from app.modules.auth.email_codes import EmailCodeService, RedisEmailCodeStore
from app.modules.auth.limits import RedisAttemptLimiter
from app.modules.auth.rbac import Permission, Principal, require_permission
from app.modules.auth.service import AuthService
from app.modules.user.service import UserService

EMAIL = "p4-rbac-email@example.com"
LOCK_EMAIL = "p4-rbac-lock@example.com"
GRAPHQL_EMAIL = "p4-rbac-graphql@example.com"
PASSWORD_USERNAME = "p4-rbac-password"


class RecordingSender:
    def __init__(self) -> None:
        self.codes: dict[str, str] = {}

    async def send_verification_code(self, email: str, code: str, _ttl_seconds: int) -> None:
        self.codes[email] = code


async def graphql(
    client: AsyncClient,
    query: str,
    variables: dict[str, Any] | None = None,
) -> dict[str, Any]:
    response = await client.post(
        "/graphql",
        json={"query": query, "variables": variables or {}},
    )
    if response.status_code not in {200, 400}:
        raise AssertionError(f"GraphQL returned HTTP {response.status_code}: {response.text}")
    return cast(dict[str, Any], response.json())


@asynccontextmanager
async def test_client(
    engine: AsyncEngine,
    redis: Redis,
    sender: RecordingSender,
    settings: Any,
) -> AsyncIterator[AsyncClient]:
    runtime = RuntimeDependencies(
        checks={},
        close=lambda: _noop_close(),
        session_factory=create_session_factory(engine),
        redis=redis,
        email_sender=sender,
    )
    app = create_app(settings=settings, runtime=runtime)
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://p4-auth-rbac") as client:
        yield client


async def _noop_close() -> None:
    return None


async def assert_empty_database(session_factory: Any) -> None:
    async with session_factory() as session:
        user_count = await session.scalar(select(func.count()).select_from(User))
        if int(user_count or 0) != 0:
            raise RuntimeError("P4 auth/RBAC verification requires a dedicated empty database")


async def run() -> None:
    settings = get_settings()
    engine = create_database_engine(settings)
    session_factory = create_session_factory(engine)
    redis = Redis.from_url(str(settings.redis_url), decode_responses=True)
    sender = RecordingSender()
    email_codes = EmailCodeService(settings, redis, sender)
    login_limiter = RedisAttemptLimiter(
        redis,
        "login",
        settings.login_fail_max_count,
        settings.login_fail_lock_seconds,
    )
    users = UserService(session_factory)
    auth = AuthService(settings, users, email_codes, login_limiter)
    store = RedisEmailCodeStore(redis)

    try:
        for email in (EMAIL, LOCK_EMAIL, GRAPHQL_EMAIL):
            await store.clear(email)
        await login_limiter.reset(PASSWORD_USERNAME)
        await assert_empty_database(session_factory)

        await store.clear(EMAIL)
        await auth.send_email_code(EMAIL)
        email_user = await auth.email_register(
            email=EMAIL,
            code=sender.codes[EMAIL],
            password="TestOnly!2026",
            role="MERCHANT",
        )
        assert email_user.role is UserRole.MERCHANT
        try:
            await auth.email_login(email=EMAIL, code=sender.codes[EMAIL])
        except AppError as error:
            assert error.code == "EMAIL_CODE_EXPIRED"
        else:
            raise AssertionError("single-use email code was accepted twice")

        await store.clear(EMAIL)
        await auth.send_email_code(EMAIL)
        logged_in_email, _ = await auth.email_login(email=EMAIL, code=sender.codes[EMAIL])
        assert logged_in_email.id == email_user.id

        await auth.send_email_code(LOCK_EMAIL)
        for _ in range(settings.email_code_fail_max_count - 1):
            try:
                await email_codes.verify_code(LOCK_EMAIL, "000000")
            except AppError as error:
                assert error.code == "EMAIL_CODE_INVALID"
            else:
                raise AssertionError("invalid email code was accepted")
        try:
            await email_codes.verify_code(LOCK_EMAIL, "000000")
        except AppError as error:
            assert error.code == "EMAIL_CODE_LOCKED"
        else:
            raise AssertionError("email code lock was not enforced")

        password_user, _ = await auth.register(
            username=PASSWORD_USERNAME,
            password="TestOnly!2026",
            role=UserRole.CUSTOMER,
        )
        for _ in range(settings.login_fail_max_count):
            try:
                await auth.login(username=PASSWORD_USERNAME, password="wrong-password")
            except AppError as error:
                assert error.code == "AUTH_INVALID"
            else:
                raise AssertionError("invalid password was accepted")
        try:
            await auth.login(username=PASSWORD_USERNAME, password="TestOnly!2026")
        except AppError as error:
            assert error.code == "AUTH_LOCKED"
        else:
            raise AssertionError("locked account was not blocked")
        await login_limiter.reset(PASSWORD_USERNAME)

        customer = Principal(password_user.id, UserRole.CUSTOMER)
        merchant = Principal(email_user.id, UserRole.MERCHANT)
        assert require_permission(customer, Permission.ORDER_CREATE) == customer
        assert require_permission(merchant, Permission.HOTEL_CREATE) == merchant
        try:
            require_permission(customer, Permission.HOTEL_CREATE)
        except AppError as error:
            assert error.code == "FORBIDDEN"
        else:
            raise AssertionError("customer was granted merchant permission")

        async with test_client(engine, redis, sender, settings) as client:
            send_result = await graphql(
                client,
                "mutation Send($email: String!) { sendEmailCode(email: $email) { code message } }",
                {"email": GRAPHQL_EMAIL},
            )
            assert send_result["data"]["sendEmailCode"]["code"] == 200

            register_result = await graphql(
                client,
                """
                mutation Register($email: String!, $code: String!, $password: String!) {
                  emailRegister(email: $email, code: $code, password: $password) {
                    code message data
                  }
                }
                """,
                {
                    "email": GRAPHQL_EMAIL,
                    "code": sender.codes[GRAPHQL_EMAIL],
                    "password": "TestOnly!2026",
                },
            )
            assert register_result["data"]["emailRegister"]["code"] == 200

            await store.clear(GRAPHQL_EMAIL)
            await email_codes.send_code(GRAPHQL_EMAIL)
            login_result = await graphql(
                client,
                """
                mutation Login($email: String!, $code: String!) {
                  emailLogin(email: $email, code: $code) {
                    code data { user { email } }
                  }
                }
                """,
                {"email": GRAPHQL_EMAIL, "code": sender.codes[GRAPHQL_EMAIL]},
            )
            assert login_result["data"]["emailLogin"]["data"]["user"]["email"] == GRAPHQL_EMAIL

    finally:
        async with session_factory() as session:
            await session.execute(
                delete(User).where(User.username.in_([EMAIL, GRAPHQL_EMAIL, PASSWORD_USERNAME]))
            )
            await session.commit()
        for email in (EMAIL, LOCK_EMAIL, GRAPHQL_EMAIL):
            await store.clear(email)
        await login_limiter.reset(PASSWORD_USERNAME)
        await redis.aclose()
        await engine.dispose()


def main() -> None:
    asyncio.run(run())
    print(
        "Verified P4 Redis email codes, failure locks, login throttling, "
        "RBAC matrix, and GraphQL wiring."
    )


if __name__ == "__main__":
    main()
