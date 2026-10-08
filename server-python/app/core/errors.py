from typing import Any

import structlog
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.request_id import REQUEST_ID_HEADER_NAME, request_id_from_scope


class AppError(Exception):
    def __init__(
        self,
        *,
        code: str,
        message: str,
        status_code: int,
        details: list[dict[str, Any]] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details


def _error_body(
    *,
    code: str,
    message: str,
    request_id: str,
    details: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "code": code,
        "message": message,
        "requestId": request_id,
    }
    if details is not None:
        body["details"] = details
    return body


def install_error_handlers(app: FastAPI) -> None:
    logger = structlog.get_logger("app.errors")

    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, error: AppError) -> JSONResponse:
        request_id = request_id_from_scope(request.scope)
        return JSONResponse(
            status_code=error.status_code,
            content=_error_body(
                code=error.code,
                message=error.message,
                request_id=request_id,
                details=error.details,
            ),
            headers={REQUEST_ID_HEADER_NAME: request_id},
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request,
        error: RequestValidationError,
    ) -> JSONResponse:
        request_id = request_id_from_scope(request.scope)
        details = [
            {
                "location": [str(part) for part in item["loc"]],
                "message": item["msg"],
                "type": item["type"],
            }
            for item in error.errors()
        ]
        return JSONResponse(
            status_code=422,
            content=_error_body(
                code="VALIDATION_ERROR",
                message="Request validation failed",
                request_id=request_id,
                details=details,
            ),
            headers={REQUEST_ID_HEADER_NAME: request_id},
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, error: Exception) -> JSONResponse:
        request_id = request_id_from_scope(request.scope)
        logger.exception(
            "unhandled_application_error",
            error_type=type(error).__name__,
            request_id=request_id,
        )
        return JSONResponse(
            status_code=500,
            content=_error_body(
                code="INTERNAL_SERVER_ERROR",
                message="Internal server error",
                request_id=request_id,
            ),
            headers={REQUEST_ID_HEADER_NAME: request_id},
        )
