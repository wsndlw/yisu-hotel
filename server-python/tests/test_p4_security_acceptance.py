from __future__ import annotations

import asyncio
import hashlib
import json
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from typing import Any, cast

import jwt
import pytest
from graphql import GraphQLError
from httpx import ASGITransport, AsyncClient
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from starlette.requests import Request

from app.api.graphql.schema import graphql_error_formatter
from app.core.config import Settings
from app.core.errors import AppError
from app.core.runtime import RuntimeDependencies
from app.db.enums import UserRole
from app.main import create_app
from app.modules.auth.admin import AdminProvisioningService
from app.modules.auth.email_codes import _code_digest
from app.modules.auth.limits import RedisAttemptLimiter
from app.modules.auth.rbac import (
    Permission,
    Principal,
    require_authenticated,
    require_permission,
    require_resource_owner,
)
from app.modules.auth.security import (
    bearer_token,
    decode_access_token,
    issue_access_token,
)
from app.modules.auth.service import AuthService
from app.modules.user.service import UserService


class FakeAttemptRedis:
    def __init__(self) -> None:
        self.values: dict[str, str] = {}
        self.expiries: dict[str, float] = {}

    def _purge(self, key: str) -> None:
        if self.expiries.get(key, 0) <= asyncio.get_event_loop().time():
            self.values.pop(key, None)
            self.expiries.pop(key, None)

    async def exists(self, key: str) -> int:
        self._purge(key)
        return int(key in self.values)

    async def incr(self, key: str) -> int:
        self._purge(key)
        value = int(self.values.get(key, "0")) + 1
        self.values[key] = str(value)
        return value

    async def expire(self, key: str, seconds: int) -> bool:
        self.expiries[key] = asyncio.get_event_loop().time() + seconds
        return True

    async def set(
        self,
        key: str,
        value: str,
        *,
        ex: int | None = None,
        nx: bool = False,
    ) -> bool:
        self._purge(key)
        if nx and key in self.values:
            return False
        self.values[key] = value
        if ex is not None:
            self.expiries[key] = asyncio.get_event_loop().time() + ex
        return True

    async def delete(self, *keys: str) -> int:
        deleted = 0
        for key in keys:
            self._purge(key)
            if key in self.values:
                deleted += 1
            self.values.pop(key, None)
            self.expiries.pop(key, None)
        return deleted


class FakeUserLookup:
    def __init__(self, user: SimpleNamespace | None) -> None:
        self.user = user

    async def find_by_id(self, _user_id: str) -> SimpleNamespace | None:
        return self.user

    async def find_by_username(self, _username: str) -> SimpleNamespace | None:
        return self.user

    async def find_by_email(self, email: str) -> SimpleNamespace | None:
        if self.user is not None and getattr(self.user, "email", None) == email:
            return self.user
        return None


class EmptySession:
    async def __aenter__(self) -> EmptySession:
        return self

    async def __aexit__(self, _exc_type: Any, _exc: Any, _traceback: Any) -> None:
        return None

    async def scalar(self, _statement: Any) -> None:
        return None


class EmptySessionFactory:
    def __call__(self) -> EmptySession:
        return EmptySession()


class FakeAdminUsers:
    def __init__(self) -> None:
        self.user: SimpleNamespace | None = None

    async def find_by_username(self, _username: str) -> SimpleNamespace | None:
        return self.user

    async def create_user(
        self,
        *,
        username: str,
        password_hash: str,
        role: UserRole,
        email: str | None = None,
    ) -> SimpleNamespace:
        self.user = SimpleNamespace(
            id="admin-1",
            username=username,
            password_hash=password_hash,
            role=role,
            email=email,
        )
        return self.user


async def noop_close() -> None:
    return None


def _request_with_token(token: str) -> Request:
    return Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/graphql",
            "headers": [(b"authorization", f"Bearer {token}".encode("ascii"))],
        }
    )


def test_expired_and_tampered_tokens_are_rejected(settings: Settings) -> None:
    now = datetime.now(UTC)
    expired = jwt.encode(
        {
            "sub": "expired-user",
            "role": UserRole.CUSTOMER.value,
            "iat": now - timedelta(minutes=10),
            "exp": now - timedelta(minutes=5),
            "iss": settings.jwt_issuer,
            "aud": settings.jwt_audience,
            "jti": "expired-jti",
        },
        settings.jwt_secret.get_secret_value(),
        algorithm="HS256",
    )
    with pytest.raises(AppError) as expired_error:
        decode_access_token(settings, expired)
    assert expired_error.value.code == "TOKEN_INVALID"

    valid = issue_access_token(settings, "valid-user", UserRole.CUSTOMER.value)
    tampered = f"{valid[:-1]}{'A' if valid[-1] != 'A' else 'B'}"
    with pytest.raises(AppError) as tampered_error:
        decode_access_token(settings, tampered)
    assert tampered_error.value.code == "TOKEN_INVALID"


def test_email_code_digest_is_keyed_and_not_a_plain_sha256_code_hash(
    settings: Settings,
) -> None:
    raw_digest = hashlib.sha256(b"safe@example.com:123456").hexdigest()
    digest = _code_digest(settings.email_code_hash_secret_value, "safe@example.com", "123456")
    assert digest != raw_digest
    assert _code_digest("secret-a", "safe@example.com", "123456") != _code_digest(
        "secret-b", "safe@example.com", "123456"
    )


@pytest.mark.parametrize("authorization", [None, "", "Basic token", "Bearer", "Bearer   "])
def test_malformed_bearer_headers_are_not_accepted(authorization: str | None) -> None:
    with pytest.raises(AppError) as error:
        bearer_token(authorization)
    assert error.value.code == "UNAUTHENTICATED"


@pytest.mark.asyncio
async def test_jwt_role_claim_cannot_elevate_database_role(settings: Settings) -> None:
    database_user = SimpleNamespace(id="customer-1", role=UserRole.CUSTOMER)
    auth = AuthService(settings, cast(Any, FakeUserLookup(database_user)))
    forged_role_token = issue_access_token(settings, database_user.id, UserRole.ADMIN.value)

    current_user = await auth.current_user(_request_with_token(forged_role_token))
    assert current_user.role is UserRole.CUSTOMER
    with pytest.raises(AppError) as forbidden:
        require_permission(
            Principal(current_user.id, current_user.role),
            Permission.HOTEL_CREATE,
        )
    assert forbidden.value.code == "FORBIDDEN"


@pytest.mark.asyncio
async def test_registration_cannot_create_admin_or_cross_user_resources(settings: Settings) -> None:
    auth = AuthService(settings, cast(Any, FakeUserLookup(None)))
    with pytest.raises(AppError) as admin_registration:
        await auth.register(
            username="public-admin",
            password="TestOnly!2026",
            role="ADMIN",
        )
    assert admin_registration.value.code == "ADMIN_REGISTRATION_FORBIDDEN"

    customer = Principal("customer-1", UserRole.CUSTOMER)
    with pytest.raises(AppError) as unauthenticated:
        require_authenticated(None)
    assert unauthenticated.value.code == "UNAUTHENTICATED"
    with pytest.raises(AppError) as cross_user:
        require_resource_owner(customer, "customer-2")
    assert cross_user.value.code == "FORBIDDEN"


@pytest.mark.asyncio
async def test_registration_conflict_does_not_disclose_account_existence(
    settings: Settings,
) -> None:
    existing = SimpleNamespace(id="user-1", username="existing", email="existing@example.com")
    auth = AuthService(settings, cast(Any, FakeUserLookup(existing)))

    with pytest.raises(AppError) as duplicate:
        await auth.register(username="existing", password="TestOnly!2026")
    assert duplicate.value.code == "REGISTRATION_FAILED"
    assert "存在" not in duplicate.value.message


@pytest.mark.asyncio
async def test_admin_provisioning_requires_strong_password_and_emits_safe_identity() -> None:
    users = FakeAdminUsers()
    provisioning = AdminProvisioningService(cast(Any, users))

    with pytest.raises(AppError) as weak_password:
        await provisioning.create_admin(
            username="admin",
            password="short",
            actor="ops-ticket-1",
            reason="break-glass test",
        )
    assert weak_password.value.code == "ADMIN_PASSWORD_WEAK"

    user = await provisioning.create_admin(
        username="admin",
        password="StrongAdmin!2026",
        actor="ops-ticket-1",
        reason="break-glass test",
    )
    assert user.role is UserRole.ADMIN
    assert user.password_hash != "StrongAdmin!2026"
    assert user.password_hash.startswith("$2b$")

    with pytest.raises(AppError) as duplicate:
        await provisioning.create_admin(
            username="admin",
            password="StrongAdmin!2026",
            actor="ops-ticket-2",
            reason="duplicate test",
        )
    assert duplicate.value.code == "ADMIN_ALREADY_EXISTS"


@pytest.mark.asyncio
async def test_login_lock_expires_and_allows_a_new_attempt() -> None:
    redis = FakeAttemptRedis()
    limiter = RedisAttemptLimiter(
        cast(Redis, redis),
        "login",
        max_attempts=2,
        lock_seconds=1,
    )

    assert await limiter.record_failure("lock-user") is False
    assert await limiter.record_failure("lock-user") is True
    with pytest.raises(AppError) as locked:
        await limiter.ensure_available("lock-user")
    assert locked.value.code == "AUTH_LOCKED"

    await asyncio.sleep(1.05)
    await limiter.ensure_available("lock-user")
    await limiter.reset("lock-user")


@pytest.mark.asyncio
async def test_protected_graphql_field_rejects_missing_auth(settings: Settings) -> None:
    runtime = RuntimeDependencies(
        checks={},
        close=noop_close,
        session_factory=cast(async_sessionmaker[AsyncSession], EmptySessionFactory()),
    )
    app = create_app(settings=settings, runtime=runtime)
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://security-test") as client:
        response = await client.post(
            "/graphql",
            json={"query": "query { me { code message } }"},
        )

    payload = response.json()
    assert response.status_code == 400
    assert payload["errors"][0]["extensions"]["code"] == "UNAUTHENTICATED"
    assert "stacktrace" not in json.dumps(payload, ensure_ascii=False)


def test_serialized_user_and_graphql_errors_do_not_leak_secrets() -> None:
    user = SimpleNamespace(
        id="user-1",
        username="safe-user",
        password_hash="$2b$10$not-for-response",
        email="safe@example.com",
        avatar_url=None,
        preferred_tag_ids=None,
        preferred_facility_ids=None,
        role=UserRole.CUSTOMER,
        created_at=None,
        updated_at=None,
    )
    serialized = UserService.serialize(cast(Any, user))
    serialized_text = json.dumps(serialized, ensure_ascii=False)
    assert "password_hash" not in serialized_text
    assert "passwordHash" not in serialized_text
    assert "$2b$" not in serialized_text

    formatted = graphql_error_formatter(
        GraphQLError(
            "Internal server error",
            original_error=RuntimeError("passwordHash=$2b$10$secret"),
        ),
        debug=True,
    )
    formatted_text = json.dumps(formatted, ensure_ascii=False)
    assert formatted["message"] == "Internal server error"
    assert "passwordHash" not in formatted_text
    assert "$2b$" not in formatted_text
    assert "stacktrace" not in formatted_text
