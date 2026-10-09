from __future__ import annotations

import hashlib
import hmac
import re
import secrets
import time
from collections.abc import Awaitable
from typing import Literal, cast

from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.core.config import Settings
from app.core.errors import AppError
from app.modules.auth.mailer import EmailSender

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
EmailCodeAttempt = Literal["verified", "missing", "expired", "invalid", "locked"]

VERIFY_CODE_SCRIPT = """
local stored = redis.call('HGET', KEYS[1], 'digest')
if not stored then
  return 0
end

local now = tonumber(ARGV[5])
local lock_until = tonumber(redis.call('HGET', KEYS[1], 'lock_until') or '0')
if lock_until > now then
  return -2
end

if stored ~= ARGV[1] then
  local fail_count = tonumber(redis.call('HGET', KEYS[1], 'fail_count') or '0') + 1
  local max_fail_count = tonumber(ARGV[2])
  if fail_count >= max_fail_count then
    redis.call('HSET', KEYS[1], 'fail_count', fail_count, 'lock_until', now + tonumber(ARGV[3]))
    local current_ttl = redis.call('TTL', KEYS[1])
    if current_ttl < tonumber(ARGV[3]) then
      redis.call('EXPIRE', KEYS[1], tonumber(ARGV[3]))
    end
    return -3
  end
  redis.call('HSET', KEYS[1], 'fail_count', fail_count)
  return -1
end

if ARGV[4] == '1' then
  redis.call('DEL', KEYS[1])
else
  redis.call('HSET', KEYS[1], 'fail_count', 0)
end
return 1
"""


def _email_identity(email: str) -> str:
    return hashlib.sha256(email.encode("utf-8")).hexdigest()


def _code_digest(secret: str, email: str, code: str) -> str:
    return hmac.new(
        secret.encode("utf-8"),
        f"{email}:{code}".encode(),
        hashlib.sha256,
    ).hexdigest()


class RedisEmailCodeStore:
    def __init__(self, redis: Redis) -> None:
        self.redis = redis

    @staticmethod
    def code_key(email: str) -> str:
        return f"auth:email-code:{_email_identity(email)}"

    @staticmethod
    def send_key(email: str) -> str:
        return f"auth:email-send:{_email_identity(email)}"

    async def reserve_send(self, email: str, interval_seconds: int) -> int:
        try:
            created = await self.redis.set(self.send_key(email), "1", ex=interval_seconds, nx=True)
            if created:
                return 0
            ttl = await cast(Awaitable[int], self.redis.ttl(self.send_key(email)))
            return max(1, int(ttl))
        except RedisError as error:
            raise AppError(
                code="AUTH_STORE_UNAVAILABLE",
                message="认证服务暂时不可用，请稍后重试",
                status_code=503,
            ) from error

    async def issue(self, email: str, digest: str, ttl_seconds: int) -> None:
        try:
            key = self.code_key(email)
            await cast(
                Awaitable[int],
                self.redis.hset(key, mapping={"digest": digest, "fail_count": 0, "lock_until": 0}),
            )
            await self.redis.expire(key, ttl_seconds)
        except RedisError as error:
            raise AppError(
                code="AUTH_STORE_UNAVAILABLE",
                message="认证服务暂时不可用，请稍后重试",
                status_code=503,
            ) from error

    async def verify(
        self,
        email: str,
        digest: str,
        *,
        max_fail_count: int,
        lock_seconds: int,
        single_use: bool,
    ) -> EmailCodeAttempt:
        try:
            result = int(
                await cast(
                    Awaitable[int],
                    self.redis.eval(
                        VERIFY_CODE_SCRIPT,
                        1,
                        self.code_key(email),
                        digest,
                        max_fail_count,
                        lock_seconds,
                        "1" if single_use else "0",
                        int(time.time()),
                    ),
                )
            )
        except RedisError as error:
            raise AppError(
                code="AUTH_STORE_UNAVAILABLE",
                message="认证服务暂时不可用，请稍后重试",
                status_code=503,
            ) from error

        statuses: dict[int, EmailCodeAttempt] = {
            1: "verified",
            0: "missing",
            -1: "invalid",
            -2: "locked",
            -3: "locked",
        }
        return statuses.get(result, "missing")

    async def clear(self, email: str) -> None:
        try:
            await self.redis.delete(self.code_key(email), self.send_key(email))
        except RedisError:
            return


class EmailCodeService:
    def __init__(
        self,
        settings: Settings,
        redis: Redis | None,
        sender: EmailSender | None,
    ) -> None:
        self.settings = settings
        self.store = RedisEmailCodeStore(redis) if redis is not None else None
        self.sender = sender

    @staticmethod
    def normalize_email(email: str) -> str:
        normalized = email.strip().lower()
        if len(normalized) > 255 or not EMAIL_PATTERN.fullmatch(normalized):
            raise AppError(code="EMAIL_INVALID", message="邮箱格式不正确", status_code=400)
        return normalized

    async def send_code(self, email: str) -> None:
        normalized = self.normalize_email(email)
        if self.store is None or self.sender is None:
            raise AppError(
                code="EMAIL_DELIVERY_UNAVAILABLE",
                message="邮箱服务暂未配置",
                status_code=503,
            )

        retry_after = await self.store.reserve_send(
            normalized, self.settings.email_send_interval_seconds
        )
        if retry_after:
            raise AppError(
                code="EMAIL_RATE_LIMITED",
                message="验证码发送过于频繁，请稍后重试",
                status_code=429,
                details=[{"retryAfterSeconds": retry_after}],
            )

        code = f"{secrets.randbelow(1_000_000):06d}"
        await self.store.issue(
            normalized,
            _code_digest(self.settings.email_code_hash_secret_value, normalized, code),
            self.settings.email_code_ttl_seconds,
        )
        try:
            await self.sender.send_verification_code(
                normalized,
                code,
                self.settings.email_code_ttl_seconds,
            )
        except Exception as error:
            await self.store.clear(normalized)
            raise AppError(
                code="EMAIL_DELIVERY_FAILED",
                message="验证码发送失败，请稍后重试",
                status_code=503,
            ) from error

    async def verify_code(self, email: str, code: str) -> str:
        normalized = self.normalize_email(email)
        if self.store is None:
            raise AppError(
                code="AUTH_STORE_UNAVAILABLE",
                message="认证服务暂时不可用，请稍后重试",
                status_code=503,
            )
        result = await self.store.verify(
            normalized,
            _code_digest(
                self.settings.email_code_hash_secret_value,
                normalized,
                code.strip(),
            ),
            max_fail_count=self.settings.email_code_fail_max_count,
            lock_seconds=self.settings.email_code_lock_seconds,
            single_use=self.settings.email_code_single_use,
        )
        if result == "verified":
            return normalized
        if result == "locked":
            raise AppError(
                code="EMAIL_CODE_LOCKED",
                message="验证码错误次数过多，请稍后重试",
                status_code=429,
            )
        if result == "invalid":
            raise AppError(
                code="EMAIL_CODE_INVALID",
                message="验证码不正确",
                status_code=401,
            )
        raise AppError(
            code="EMAIL_CODE_EXPIRED",
            message="验证码已失效，请重新获取",
            status_code=401,
        )
