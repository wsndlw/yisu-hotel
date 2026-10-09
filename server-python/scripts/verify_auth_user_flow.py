from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any, cast

from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncEngine
from starlette.requests import Request

from app.core.config import get_settings
from app.core.errors import AppError
from app.core.runtime import RuntimeDependencies
from app.db.models import User
from app.db.session import create_database_engine, create_session_factory
from app.main import create_app
from app.modules.auth.security import decode_access_token
from app.modules.auth.service import AuthService
from app.modules.user.service import UserService

FIXTURE_USERNAME = "p4-auth-flow-user"
FIXTURE_UPDATED_USERNAME = "p4-auth-flow-updated"


def request_with_token(token: str) -> Request:
    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/graphql",
            "headers": [(b"authorization", f"Bearer {token}".encode("ascii"))],
            "state": {},
        }
    )


async def graphql(
    client: AsyncClient,
    query: str,
    variables: dict[str, Any] | None = None,
    token: str | None = None,
) -> dict[str, Any]:
    headers = {"Authorization": f"Bearer {token}"} if token else None
    response = await client.post(
        "/graphql",
        json={"query": query, "variables": variables or {}},
        headers=headers,
    )
    if response.status_code not in {200, 400}:
        raise AssertionError(f"GraphQL returned HTTP {response.status_code}: {response.text}")
    return cast(dict[str, Any], response.json())


@asynccontextmanager
async def test_client(engine: AsyncEngine, settings: Any) -> AsyncIterator[AsyncClient]:
    session_factory = create_session_factory(engine)

    async def close() -> None:
        return None

    runtime = RuntimeDependencies(
        checks={},
        close=close,
        session_factory=session_factory,
    )
    app = create_app(settings=settings, runtime=runtime)
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://p4-auth-test") as client:
        yield client


async def assert_dedicated_empty_database(session_factory: Any) -> None:
    async with session_factory() as session:
        user_count = await session.scalar(select(func.count()).select_from(User))
        if int(user_count or 0) != 0:
            raise RuntimeError("P4 auth flow verification requires a dedicated empty database")


async def run() -> None:
    settings = get_settings()
    engine = create_database_engine(settings)
    session_factory = create_session_factory(engine)
    users = UserService(session_factory)
    auth = AuthService(settings, users)

    try:
        await assert_dedicated_empty_database(session_factory)

        user, token = await auth.register(
            username=FIXTURE_USERNAME,
            password="TestOnly!2026",
        )
        claims = decode_access_token(settings, token)
        assert claims["sub"] == user.id
        assert claims["role"] == "CUSTOMER"
        assert {"iss", "aud", "iat", "exp", "jti"}.issubset(claims)

        logged_in_user, login_token = await auth.login(
            username=FIXTURE_USERNAME,
            password="TestOnly!2026",
        )
        assert logged_in_user.id == user.id
        assert decode_access_token(settings, login_token)["sub"] == user.id

        current_user = await auth.current_user(request_with_token(login_token))
        assert current_user.id == user.id

        updated_user = await users.update_current_user(
            user.id,
            {"username": FIXTURE_UPDATED_USERNAME, "avatarUrl": "https://example.invalid/avatar"},
        )
        assert updated_user.username == FIXTURE_UPDATED_USERNAME
        assert updated_user.avatar_url == "https://example.invalid/avatar"

        try:
            await auth.register(username=FIXTURE_UPDATED_USERNAME, password="TestOnly!2026")
        except AppError as error:
            assert error.code == "REGISTRATION_FAILED"
            assert "存在" not in error.message
        else:
            raise AssertionError("duplicate username was accepted")

        try:
            await auth.register(
                username="p4-auth-flow-admin", password="TestOnly!2026", role="ADMIN"
            )
        except AppError as error:
            assert error.code == "ADMIN_REGISTRATION_FORBIDDEN"
        else:
            raise AssertionError("public ADMIN registration was accepted")

        async with test_client(engine, settings) as client:
            login_result = await graphql(
                client,
                """
                mutation Login($input: LoginInput!) {
                  login(input: $input) {
                    code message data { accessToken user { id username role } }
                  }
                }
                """,
                {"input": {"username": FIXTURE_UPDATED_USERNAME, "password": "TestOnly!2026"}},
            )
            assert "errors" not in login_result
            graphql_token = login_result["data"]["login"]["data"]["accessToken"]

            me_result = await graphql(
                client,
                "query Me { me { code message data { id username email role avatarUrl } } }",
            )
            assert me_result["errors"][0]["extensions"]["code"] == "UNAUTHENTICATED"

            me_result = await graphql(
                client,
                "query Me { me { code message data { id username email role avatarUrl } } }",
                token=graphql_token,
            )
            assert me_result["data"]["me"]["data"]["username"] == FIXTURE_UPDATED_USERNAME

            update_result = await graphql(
                client,
                """
                mutation UpdateMe($input: UpdateMeInput!) {
                  updateMe(input: $input) { code message data { username avatarUrl } }
                }
                """,
                {"input": {"username": "p4-auth-flow-graphql"}},
                token=graphql_token,
            )
            assert update_result["data"]["updateMe"]["data"]["username"] == "p4-auth-flow-graphql"

    finally:
        async with session_factory() as session:
            await session.execute(
                delete(User).where(
                    User.username.in_(
                        [
                            FIXTURE_USERNAME,
                            FIXTURE_UPDATED_USERNAME,
                            "p4-auth-flow-graphql",
                            "p4-auth-flow-admin",
                        ]
                    )
                )
            )
            await session.commit()
        await engine.dispose()


def main() -> None:
    asyncio.run(run())
    print(
        "Verified P4 password/JWT registration, login, current-user, profile update, "
        "and GraphQL wiring."
    )


if __name__ == "__main__":
    main()
