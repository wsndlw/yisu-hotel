from collections.abc import Awaitable, Callable, Mapping
from dataclasses import dataclass
from typing import cast

from redis.asyncio import Redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.core.config import Settings

HealthCheck = Callable[[], Awaitable[None]]
CloseRuntime = Callable[[], Awaitable[None]]


async def _no_op_close() -> None:
    return None


@dataclass(frozen=True, slots=True)
class RuntimeDependencies:
    checks: Mapping[str, HealthCheck]
    close: CloseRuntime = _no_op_close


def create_runtime(settings: Settings) -> RuntimeDependencies:
    engine: AsyncEngine = create_async_engine(
        settings.database_url,
        pool_pre_ping=True,
        pool_size=settings.db_pool_size,
        echo=settings.db_echo,
    )
    redis_client = Redis.from_url(str(settings.redis_url), decode_responses=True)

    async def check_database() -> None:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))

    async def check_redis() -> None:
        await cast(Awaitable[bool], redis_client.ping())

    async def close() -> None:
        await redis_client.aclose()
        await engine.dispose()

    return RuntimeDependencies(
        checks={"database": check_database, "redis": check_redis},
        close=close,
    )
