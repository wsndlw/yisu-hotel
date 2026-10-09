from pathlib import Path
from typing import Any

from ariadne import MutationType, QueryType, format_error, make_executable_schema
from ariadne.asgi import GraphQL
from graphql import GraphQLError, GraphQLSchema
from starlette.requests import Request

from app.core.config import Settings
from app.core.errors import AppError
from app.core.request_id import current_request_id
from app.modules.auth.service import AuthService
from app.modules.user.service import UserService

query = QueryType()
mutation = MutationType()


def _services(context: dict[str, Any]) -> tuple[AuthService, UserService]:
    settings: Settings = context["settings"]
    session_factory = context.get("session_factory")
    if session_factory is None:
        raise AppError(
            code="DATABASE_NOT_CONFIGURED",
            message="Database session is not configured",
            status_code=503,
        )
    users = UserService(session_factory)
    return AuthService(settings, users), users


def _auth_payload(access_token: str, user: Any) -> dict[str, Any]:
    return {"accessToken": access_token, "user": UserService.serialize(user)}


@mutation.field("register")
async def register(_obj: Any, info: Any, input: dict[str, Any]) -> dict[str, Any]:
    auth, _users = _services(info.context)
    user, access_token = await auth.register(
        username=input.get("username", ""),
        password=input.get("password", ""),
        role=input.get("role"),
        email=input.get("email"),
    )
    return {"code": 200, "message": "注册成功", "data": _auth_payload(access_token, user)}


@mutation.field("login")
async def login(_obj: Any, info: Any, input: dict[str, Any]) -> dict[str, Any]:
    auth, _users = _services(info.context)
    user, access_token = await auth.login(
        username=input.get("username", ""),
        password=input.get("password", ""),
    )
    return {"code": 200, "message": "登录成功", "data": _auth_payload(access_token, user)}


@query.field("me")
async def me(_obj: Any, info: Any) -> dict[str, Any]:
    auth, _users = _services(info.context)
    user = await auth.current_user(info.context["request"])
    return {"code": 200, "message": "获取成功", "data": UserService.serialize(user)}


@mutation.field("updateMe")
async def update_me(_obj: Any, info: Any, input: dict[str, Any]) -> dict[str, Any]:
    auth, users = _services(info.context)
    current_user = await auth.current_user(info.context["request"])
    user = await users.update_current_user(current_user.id, input)
    return {"code": 200, "message": "更新成功", "data": UserService.serialize(user)}


def load_schema_source(path: Path) -> str:
    resolved_path = path if path.is_absolute() else Path.cwd() / path
    try:
        return resolved_path.read_text(encoding="utf-8")
    except FileNotFoundError as error:
        raise RuntimeError(f"GraphQL schema not found: {resolved_path}") from error


def build_schema(settings: Settings) -> GraphQLSchema:
    type_defs = load_schema_source(settings.graphql_schema_path)
    return make_executable_schema(type_defs, query, mutation)


async def graphql_context(request: Request, _data: Any = None) -> dict[str, Any]:
    return {
        "request": request,
        "request_id": current_request_id(),
        "settings": request.app.state.settings,
        "session_factory": request.app.state.runtime.session_factory,
    }


def graphql_error_formatter(error: GraphQLError, debug: bool = False) -> dict[str, Any]:
    formatted = format_error(error, debug)
    extensions = dict(formatted.get("extensions") or {})
    if isinstance(error.original_error, AppError):
        extensions["code"] = error.original_error.code
        extensions["statusCode"] = error.original_error.status_code
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
