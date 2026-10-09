from __future__ import annotations

import hashlib

from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.core.errors import AppError


class RedisAttemptLimiter:
    def __init__(self, redis: Redis, namespace: str, max_attempts: int, lock_seconds: int) -> None:
        self.redis = redis
        self.namespace = namespace
        self.max_attempts = max_attempts
        self.lock_seconds = lock_seconds

    def _identity(self, value: str) -> str:
        digest = hashlib.sha256(value.strip().lower().encode("utf-8")).hexdigest()
        return f"auth:{self.namespace}:{digest}"

    async def ensure_available(self, value: str) -> None:
        try:
            if await self.redis.exists(f"{self._identity(value)}:lock"):
                raise AppError(
                    code="AUTH_LOCKED",
                    message="登录失败次数过多，请稍后重试",
                    status_code=429,
                )
        except AppError:
            raise
        except RedisError as error:
            raise AppError(
                code="AUTH_STORE_UNAVAILABLE",
                message="认证服务暂时不可用，请稍后重试",
                status_code=503,
            ) from error

    async def record_failure(self, value: str) -> bool:
        key = self._identity(value)
        try:
            count = int(await self.redis.incr(f"{key}:count"))
            if count == 1:
                await self.redis.expire(f"{key}:count", self.lock_seconds)
            if count >= self.max_attempts:
                await self.redis.set(f"{key}:lock", "1", ex=self.lock_seconds)
                return True
            return False
        except RedisError as error:
            raise AppError(
                code="AUTH_STORE_UNAVAILABLE",
                message="认证服务暂时不可用，请稍后重试",
                status_code=503,
            ) from error

    async def reset(self, value: str) -> None:
        key = self._identity(value)
        try:
            await self.redis.delete(f"{key}:count", f"{key}:lock")
        except RedisError as error:
            raise AppError(
                code="AUTH_STORE_UNAVAILABLE",
                message="认证服务暂时不可用，请稍后重试",
                status_code=503,
            ) from error
