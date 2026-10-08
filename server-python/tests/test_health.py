import json
from collections.abc import AsyncIterator

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.core.config import Settings
from app.core.errors import AppError
from app.core.request_id import current_request_id
from app.core.runtime import RuntimeDependencies
from app.main import create_app


async def failing_check() -> None:
    raise ConnectionError("dependency unavailable")


async def healthy_check() -> None:
    return None


async def client_for(
    settings: Settings,
    runtime: RuntimeDependencies,
) -> AsyncIterator[AsyncClient]:
    app = create_app(settings=settings, runtime=runtime)
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.mark.asyncio
async def test_liveness_does_not_depend_on_external_services(client: AsyncClient) -> None:
    response = await client.get("/health/live", headers={"X-Request-ID": "manual-check-1"})

    assert response.status_code == 200
    assert response.json() == {"status": "alive", "version": "0.1.0"}
    assert response.headers["X-Request-ID"] == "manual-check-1"


@pytest.mark.asyncio
async def test_readiness_reports_each_dependency(client: AsyncClient) -> None:
    response = await client.get("/health/ready")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ready",
        "checks": {"database": "up", "redis": "up"},
    }


@pytest.mark.asyncio
async def test_readiness_returns_503_without_leaking_connection_details(
    settings: Settings,
) -> None:
    runtime = RuntimeDependencies(checks={"database": failing_check, "redis": healthy_check})

    async for client in client_for(settings, runtime):
        response = await client.get("/health/ready")

    assert response.status_code == 503
    assert response.json() == {
        "status": "not_ready",
        "checks": {"database": "down", "redis": "up"},
    }
    assert "dependency unavailable" not in response.text


@pytest.mark.asyncio
async def test_invalid_request_id_is_replaced(client: AsyncClient) -> None:
    response = await client.get("/health/live", headers={"X-Request-ID": "invalid request id"})

    request_id = response.headers["X-Request-ID"]
    assert request_id != "invalid request id"
    assert len(request_id) == 36


@pytest.mark.asyncio
async def test_application_and_validation_errors_use_stable_envelope(
    settings: Settings,
) -> None:
    runtime = RuntimeDependencies(checks={"database": healthy_check, "redis": healthy_check})
    app: FastAPI = create_app(settings=settings, runtime=runtime)

    @app.get("/expected-error")
    async def expected_error() -> None:
        raise AppError(code="EXPECTED", message="Expected failure", status_code=409)

    @app.get("/validated")
    async def validated(value: int) -> dict[str, int]:
        return {"value": value}

    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as local_client:
        expected = await local_client.get(
            "/expected-error",
            headers={"X-Request-ID": "expected-error-id"},
        )
        invalid = await local_client.get("/validated?value=not-an-integer")

    assert expected.status_code == 409
    assert expected.json() == {
        "code": "EXPECTED",
        "message": "Expected failure",
        "requestId": "expected-error-id",
    }
    assert expected.headers.get_list("X-Request-ID") == ["expected-error-id"]
    assert invalid.status_code == 422
    assert invalid.json()["code"] == "VALIDATION_ERROR"
    assert invalid.json()["details"][0]["location"] == ["query", "value"]


@pytest.mark.asyncio
async def test_unhandled_error_preserves_request_id_after_context_cleanup(
    settings: Settings,
    capsys: pytest.CaptureFixture[str],
) -> None:
    runtime = RuntimeDependencies(checks={"database": healthy_check, "redis": healthy_check})
    app: FastAPI = create_app(settings=settings, runtime=runtime)

    @app.get("/unexpected-error")
    async def unexpected_error() -> None:
        raise RuntimeError("unexpected test failure")

    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as local_client:
        response = await local_client.get(
            "/unexpected-error",
            headers={"X-Request-ID": "boom-id"},
        )

    assert response.status_code == 500
    assert response.headers.get_list("X-Request-ID") == ["boom-id"]
    assert response.json() == {
        "code": "INTERNAL_SERVER_ERROR",
        "message": "Internal server error",
        "requestId": "boom-id",
    }
    assert current_request_id() == "unavailable"

    log_events = [
        json.loads(line) for line in capsys.readouterr().out.splitlines() if line.startswith("{")
    ]
    error_event = next(
        event for event in log_events if event["event"] == "unhandled_application_error"
    )
    assert error_event["request_id"] == "boom-id"
