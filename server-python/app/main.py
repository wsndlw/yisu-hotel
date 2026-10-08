from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import Response

from app.api.graphql.schema import create_graphql_app
from app.api.health import router as health_router
from app.core.config import Settings, get_settings
from app.core.errors import install_error_handlers
from app.core.logging import configure_logging
from app.core.request_id import RequestContextMiddleware
from app.core.runtime import RuntimeDependencies, create_runtime


def create_app(
    settings: Settings | None = None,
    runtime: RuntimeDependencies | None = None,
) -> FastAPI:
    resolved_settings = settings or get_settings()
    resolved_runtime = runtime or create_runtime(resolved_settings)
    configure_logging(resolved_settings.log_level)

    @asynccontextmanager
    async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
        yield
        await resolved_runtime.close()

    app = FastAPI(
        title=resolved_settings.app_name,
        version=resolved_settings.app_version,
        docs_url="/docs" if resolved_settings.docs_enabled else None,
        redoc_url=None,
        openapi_url="/openapi.json" if resolved_settings.docs_enabled else None,
        lifespan=lifespan,
    )
    app.state.settings = resolved_settings
    app.state.runtime = resolved_runtime

    app.add_middleware(
        CORSMiddleware,
        allow_origins=resolved_settings.cors_origin_strings,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    )
    app.add_middleware(RequestContextMiddleware)
    install_error_handlers(app)
    app.include_router(health_router)

    graphql_app = create_graphql_app(resolved_settings)

    async def graphql_http(request: Request) -> Response:
        return await graphql_app.handle_request(request)

    async def graphql_websocket(websocket: WebSocket) -> None:
        await graphql_app.handle_websocket(websocket)

    app.add_route("/graphql", graphql_http, methods=["GET", "POST"])
    app.add_api_websocket_route("/graphql", graphql_websocket)
    return app


app = create_app()
