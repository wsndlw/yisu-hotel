from __future__ import annotations

import asyncio
import time
from types import SimpleNamespace
from typing import Any, cast

import pytest
from redis.asyncio import Redis

from app.core.errors import AppError
from app.db.enums import UserRole
from app.modules.auth.email_codes import EmailCodeService
from app.modules.auth.mailer import EmailSender
from app.modules.auth.rbac import (
    ROLE_PERMISSIONS,
    Permission,
    Principal,
    require_permission,
    require_permissions,
    require_resource_owner,
    require_roles,
)
from app.modules.auth.service import AuthService


class FakeRedis:
    def __init__(self) -> None:
        self.values: dict[str, str] = {}
        self.hashes: dict[str, dict[str, str]] = {}
        self.expiries: dict[str, float] = {}

    def _purge(self, key: str) -> None:
        if self.expiries.get(key, 0) <= time.time():
            self.values.pop(key, None)
            self.hashes.pop(key, None)
            self.expiries.pop(key, None)

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
            self.expiries[key] = time.time() + ex
        return True

    async def ttl(self, key: str) -> int:
        self._purge(key)
        return max(1, int(self.expiries.get(key, time.time() + 1) - time.time()))

    async def hset(self, key: str, *, mapping: dict[str, Any]) -> int:
        self._purge(key)
        self.hashes[key] = {name: str(value) for name, value in mapping.items()}
        return len(mapping)

    async def expire(self, key: str, seconds: int) -> bool:
        self.expiries[key] = time.time() + seconds
        return True

    async def delete(self, *keys: str) -> int:
        deleted = 0
        for key in keys:
            if key in self.values or key in self.hashes:
                deleted += 1
            self.values.pop(key, None)
            self.hashes.pop(key, None)
            self.expiries.pop(key, None)
        return deleted

    async def eval(self, _script: str, _numkeys: int, *args: Any) -> int:
        key, digest, max_fail, lock_seconds, single_use, now = args
        self._purge(key)
        challenge = self.hashes.get(key)
        if challenge is None:
            return 0
        if int(challenge.get("lock_until", "0")) > int(now):
            return -2
        if challenge["digest"] != digest:
            fail_count = int(challenge.get("fail_count", "0")) + 1
            challenge["fail_count"] = str(fail_count)
            if fail_count >= int(max_fail):
                challenge["lock_until"] = str(int(now) + int(lock_seconds))
                self.expiries[key] = time.time() + int(lock_seconds)
                return -3
            return -1
        if single_use == "1":
            await self.delete(key)
        else:
            challenge["fail_count"] = "0"
        return 1


class RecordingSender:
    def __init__(self) -> None:
        self.codes: dict[str, str] = {}

    async def send_verification_code(self, email: str, code: str, _ttl_seconds: int) -> None:
        self.codes[email] = code


class FakeUsers:
    def __init__(self) -> None:
        self.users: dict[str, SimpleNamespace] = {}

    async def find_by_username(self, username: str) -> SimpleNamespace | None:
        return self.users.get(username)

    async def find_by_email(self, email: str) -> SimpleNamespace | None:
        return next((user for user in self.users.values() if user.email == email), None)

    async def create_user(
        self,
        *,
        username: str,
        password_hash: str,
        role: UserRole,
        email: str | None = None,
    ) -> SimpleNamespace:
        user = SimpleNamespace(
            id=f"user-{len(self.users) + 1}",
            username=username,
            password_hash=password_hash,
            role=role,
            email=email,
        )
        self.users[username] = user
        return user


class StubEmailCodes:
    def __init__(self) -> None:
        self.sent: list[str] = []

    async def send_code(self, email: str) -> None:
        self.sent.append(email)

    async def verify_code(self, email: str, _code: str) -> str:
        return email.strip().lower()


class StubLoginLimiter:
    def __init__(self) -> None:
        self.failures: list[str] = []
        self.reset_values: list[str] = []

    async def ensure_available(self, _value: str) -> None:
        return None

    async def record_failure(self, value: str) -> bool:
        self.failures.append(value)
        return False

    async def reset(self, value: str) -> None:
        self.reset_values.append(value)


@pytest.mark.asyncio
async def test_auth_service_email_and_login_flows(settings: Any) -> None:
    users = FakeUsers()
    email_codes = StubEmailCodes()
    limiter = StubLoginLimiter()
    auth = AuthService(
        settings,
        cast(Any, users),
        cast(Any, email_codes),
        cast(Any, limiter),
    )

    user, token = await auth.register(username="service-user", password="TestOnly!2026")
    assert user.role is UserRole.CUSTOMER
    assert token
    logged_in, _ = await auth.login(username="service-user", password="TestOnly!2026")
    assert logged_in.id == user.id
    assert limiter.reset_values == ["service-user"]
    with pytest.raises(AppError) as invalid:
        await auth.login(username="service-user", password="wrong-password")
    assert invalid.value.code == "AUTH_INVALID"
    assert limiter.failures == ["service-user"]

    await auth.send_email_code("Email.User@example.com")
    assert email_codes.sent == ["Email.User@example.com"]
    email_user = await auth.email_register(
        email="Email.User@example.com",
        code="123456",
        password="TestOnly!2026",
        role="MERCHANT",
    )
    assert email_user.role is UserRole.MERCHANT
    logged_in_email, email_token = await auth.email_login(
        email="Email.User@example.com", code="123456"
    )
    assert logged_in_email.id == email_user.id
    assert email_token


@pytest.mark.asyncio
async def test_email_codes_are_rate_limited_and_single_use(settings: Any) -> None:
    fake_redis = FakeRedis()
    sender = RecordingSender()
    service = EmailCodeService(
        settings.model_copy(update={"email_code_ttl_seconds": 300}),
        cast(Redis, fake_redis),
        cast(EmailSender, sender),
    )

    await service.send_code("Test.User@example.com")
    with pytest.raises(AppError) as rate_limited:
        await service.send_code("test.user@example.com")
    assert rate_limited.value.code == "EMAIL_RATE_LIMITED"

    code = sender.codes["test.user@example.com"]
    assert await service.verify_code("test.user@example.com", code) == "test.user@example.com"
    with pytest.raises(AppError) as consumed:
        await service.verify_code("test.user@example.com", code)
    assert consumed.value.code == "EMAIL_CODE_EXPIRED"


@pytest.mark.asyncio
async def test_email_code_failures_lock_the_challenge(settings: Any) -> None:
    fake_redis = FakeRedis()
    sender = RecordingSender()
    service = EmailCodeService(
        settings.model_copy(update={"email_code_fail_max_count": 3}),
        cast(Redis, fake_redis),
        cast(EmailSender, sender),
    )
    await service.send_code("lock@example.com")

    for _ in range(2):
        with pytest.raises(AppError) as invalid:
            await service.verify_code("lock@example.com", "000000")
        assert invalid.value.code == "EMAIL_CODE_INVALID"
    with pytest.raises(AppError) as locked:
        await service.verify_code("lock@example.com", "000000")
    assert locked.value.code == "EMAIL_CODE_LOCKED"


@pytest.mark.asyncio
async def test_email_code_lock_expires_and_allows_a_new_attempt(settings: Any) -> None:
    fake_redis = FakeRedis()
    sender = RecordingSender()
    service = EmailCodeService(
        settings.model_copy(
            update={
                "email_code_ttl_seconds": 60,
                "email_send_interval_seconds": 1,
                "email_code_fail_max_count": 2,
                "email_code_lock_seconds": 1,
            }
        ),
        cast(Redis, fake_redis),
        cast(EmailSender, sender),
    )
    await service.send_code("unlock@example.com")

    with pytest.raises(AppError) as first_invalid:
        await service.verify_code("unlock@example.com", "000000")
    assert first_invalid.value.code == "EMAIL_CODE_INVALID"
    with pytest.raises(AppError) as locked:
        await service.verify_code("unlock@example.com", "000000")
    assert locked.value.code == "EMAIL_CODE_LOCKED"

    await asyncio.sleep(1.05)
    await service.send_code("unlock@example.com")
    assert (
        await service.verify_code("unlock@example.com", sender.codes["unlock@example.com"])
        == "unlock@example.com"
    )


def test_rbac_matrix_and_resource_ownership() -> None:
    expected = {
        UserRole.CUSTOMER: {
            Permission.PROFILE_READ,
            Permission.PROFILE_UPDATE,
            Permission.ORDER_CREATE,
            Permission.ORDER_READ_OWN,
            Permission.ORDER_CANCEL_OWN,
        },
        UserRole.MERCHANT: {
            Permission.PROFILE_READ,
            Permission.PROFILE_UPDATE,
            Permission.HOTEL_CREATE,
            Permission.HOTEL_READ_OWN,
            Permission.HOTEL_UPDATE_OWN,
            Permission.HOTEL_DELETE_OWN,
            Permission.HOTEL_SUBMIT,
            Permission.ROOM_MANAGE_OWN,
            Permission.CALENDAR_MANAGE_OWN,
        },
        UserRole.ADMIN: set(Permission),
    }
    assert {role: set(permissions) for role, permissions in ROLE_PERMISSIONS.items()} == expected

    principals = {
        UserRole.CUSTOMER: Principal("customer-1", UserRole.CUSTOMER),
        UserRole.MERCHANT: Principal("merchant-1", UserRole.MERCHANT),
        UserRole.ADMIN: Principal("admin-1", UserRole.ADMIN),
    }
    for role, principal in principals.items():
        for permission in Permission:
            if permission in expected[role]:
                assert require_permission(principal, permission) == principal
            else:
                with pytest.raises(AppError) as forbidden:
                    require_permission(principal, permission)
                assert forbidden.value.code == "FORBIDDEN"

    assert (
        require_roles(principals[UserRole.CUSTOMER], UserRole.CUSTOMER)
        == principals[UserRole.CUSTOMER]
    )
    with pytest.raises(AppError) as wrong_role:
        require_roles(principals[UserRole.CUSTOMER], UserRole.MERCHANT)
    assert wrong_role.value.code == "FORBIDDEN"
    assert (
        require_resource_owner(principals[UserRole.CUSTOMER], "customer-1")
        == principals[UserRole.CUSTOMER]
    )
    assert (
        require_resource_owner(principals[UserRole.ADMIN], "other-user")
        == principals[UserRole.ADMIN]
    )
    with pytest.raises(AppError) as cross_user:
        require_resource_owner(principals[UserRole.CUSTOMER], "other-user")
    assert cross_user.value.code == "FORBIDDEN"


@pytest.mark.asyncio
async def test_graphql_rbac_decorator_loads_database_principal() -> None:
    class AuthStub:
        async def current_user(self, _request: object) -> SimpleNamespace:
            return SimpleNamespace(id="customer-1", role=UserRole.CUSTOMER)

    @require_permissions(Permission.PROFILE_READ)
    async def resolver(_parent: object, _info: object) -> str:
        return "ok"

    context = {"auth_service": AuthStub(), "request": object()}
    info = SimpleNamespace(context=context)
    assert await resolver(None, info) == "ok"
