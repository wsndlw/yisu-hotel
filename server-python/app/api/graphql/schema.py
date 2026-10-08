from pathlib import Path
from typing import Any

from ariadne import format_error, make_executable_schema
from ariadne.asgi import GraphQL
from graphql import GraphQLError, GraphQLSchema
from starlette.requests import Request

from app.core.config import Settings
from app.core.request_id import current_request_id


def load_schema_source(path: Path) -> str:
    resolved_path = path if path.is_absolute() else Path.cwd() / path
    try:
        return resolved_path.read_text(encoding="utf-8")
    except FileNotFoundError as error:
        raise RuntimeError(f"GraphQL schema not found: {resolved_path}") from error


def build_schema(settings: Settings) -> GraphQLSchema:
    type_defs = load_schema_source(settings.graphql_schema_path)
    return make_executable_schema(type_defs)


async def graphql_context(request: Request, _data: Any = None) -> dict[str, Any]:
    return {"request": request, "request_id": current_request_id()}


def graphql_error_formatter(error: GraphQLError, debug: bool = False) -> dict[str, Any]:
    formatted = format_error(error, debug)
    extensions = dict(formatted.get("extensions") or {})
    extensions.setdefault("code", "GRAPHQL_ERROR")
    extensions["requestId"] = current_request_id()
    formatted["extensions"] = extensions
    return formatted


def create_graphql_app(settings: Settings) -> GraphQL:
    return GraphQL(
        build_schema(settings),
        context_value=graphql_context,
        debug=settings.environment == "development",
        error_formatter=graphql_error_formatter,
    )
