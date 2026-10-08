import re
import time
from contextvars import ContextVar, Token
from uuid import uuid4

import structlog
from starlette.types import ASGIApp, Message, Receive, Scope, Send

REQUEST_ID_HEADER = b"x-request-id"
REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9._-]{1,128}$")
request_id_context: ContextVar[str | None] = ContextVar("request_id", default=None)


def current_request_id() -> str:
    return request_id_context.get() or "unavailable"


def _request_id_from_scope(scope: Scope) -> str:
    for name, value in scope.get("headers", []):
        if name.lower() == REQUEST_ID_HEADER:
            candidate = bytes(value).decode("ascii", errors="ignore")
            if REQUEST_ID_PATTERN.fullmatch(candidate):
                return candidate
    return str(uuid4())


class RequestContextMiddleware:
    """Add a bounded request ID and one structured access log per HTTP request."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app
        self.logger = structlog.get_logger("http.access")

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request_id = _request_id_from_scope(scope)
        token: Token[str | None] = request_id_context.set(request_id)
        start = time.perf_counter()
        status_code = 500

        async def send_with_request_id(message: Message) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = int(message["status"])
                headers = list(message.get("headers", []))
                headers.append((REQUEST_ID_HEADER, request_id.encode("ascii")))
                message["headers"] = headers
            await send(message)

        try:
            await self.app(scope, receive, send_with_request_id)
        finally:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            self.logger.info(
                "http_request_completed",
                method=scope.get("method"),
                path=scope.get("path"),
                status_code=status_code,
                duration_ms=duration_ms,
                request_id=request_id,
            )
            request_id_context.reset(token)
