import os
from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient

os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_PORT", "3306")
os.environ.setdefault("DB_USER", "test")
os.environ.setdefault("DB_PASSWORD", "test")
os.environ.setdefault("DB_NAME", "yisu_test")
os.environ.setdefault("DB_POOL_SIZE", "5")
os.environ.setdefault("DB_ECHO", "false")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/15")
os.environ.setdefault("JWT_SECRET", "test-only-secret-with-at-least-thirty-two-characters")
os.environ.setdefault("JWT_EXPIRES_IN", "7d")
os.environ.setdefault("JWT_ISSUER", "yisu-test")
os.environ.setdefault("JWT_AUDIENCE", "yisu-test-clients")
os.environ.setdefault("CORS_ORIGINS", '["http://localhost:5173"]')
os.environ.setdefault(
    "GRAPHQL_SCHEMA_PATH",
    "../docs/refactor/p1/baseline/schema.graphql",
)

from app.core.config import Settings  # noqa: E402
from app.core.runtime import RuntimeDependencies  # noqa: E402
from app.main import create_app  # noqa: E402


async def healthy_check() -> None:
    return None


@pytest.fixture
def settings() -> Settings:
    return Settings(_env_file=None)


@pytest.fixture
def healthy_runtime() -> RuntimeDependencies:
    return RuntimeDependencies(checks={"database": healthy_check, "redis": healthy_check})


@pytest.fixture
async def client(
    settings: Settings,
    healthy_runtime: RuntimeDependencies,
) -> AsyncIterator[AsyncClient]:
    app = create_app(settings=settings, runtime=healthy_runtime)
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as test_client:
        yield test_client
