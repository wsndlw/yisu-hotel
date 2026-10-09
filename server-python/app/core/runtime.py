from collections.abc import Awaitable, Callable, Mapping
from dataclasses import dataclass
from typing import cast

from redis.asyncio import Redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from app.core.config import Settings
from app.db.session import create_database_engine, create_session_factory

HealthCheck = Callable[[], Awaitable[None]]
CloseRuntime = Callable[[], Awaitable[None]]


async def _no_op_close() -> None:
    return None


@dataclass(frozen=True, slots=True)
class RuntimeDependencies:
    checks: Mapping[str, HealthCheck]
    close: CloseRuntime = _no_op_close
    session_factory: async_sessionmaker[AsyncSession] | None = None


def create_runtime(settings: Settings) -> RuntimeDependencies:
    engine: AsyncEngine = create_database_engine(settings)
    session_factory = create_session_factory(engine)
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
        session_factory=session_factory,
    )
