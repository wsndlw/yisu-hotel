import asyncio
from typing import Literal

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.core.runtime import HealthCheck, RuntimeDependencies

router = APIRouter(prefix="/health", tags=["health"])


class LivenessResponse(BaseModel):
    status: Literal["alive"]
    version: str


class ReadinessResponse(BaseModel):
    status: Literal["ready", "not_ready"]
    checks: dict[str, Literal["up", "down"]]


async def _run_check(check: HealthCheck, timeout_seconds: float) -> Literal["up", "down"]:
    try:
        await asyncio.wait_for(check(), timeout=timeout_seconds)
    except Exception:
        return "down"
    return "up"


@router.get("/live", response_model=LivenessResponse)
async def liveness(request: Request) -> LivenessResponse:
    return LivenessResponse(status="alive", version=request.app.state.settings.app_version)


@router.get(
    "/ready",
    response_model=ReadinessResponse,
    responses={503: {"model": ReadinessResponse}},
)
async def readiness(request: Request) -> ReadinessResponse | JSONResponse:
    runtime: RuntimeDependencies = request.app.state.runtime
    timeout: float = request.app.state.settings.health_check_timeout_seconds
    names = list(runtime.checks)
    results = await asyncio.gather(
        *(_run_check(runtime.checks[name], timeout) for name in names),
    )
    checks = dict(zip(names, results, strict=True))
    ready = all(result == "up" for result in results)
    body = ReadinessResponse(status="ready" if ready else "not_ready", checks=checks)
    if ready:
        return body
    return JSONResponse(status_code=503, content=body.model_dump())
