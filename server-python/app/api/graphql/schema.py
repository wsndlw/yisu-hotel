from pathlib import Path
from typing import Any

from ariadne import MutationType, QueryType, format_error, make_executable_schema
from ariadne.asgi import GraphQL
from graphql import GraphQLError, GraphQLSchema
from starlette.requests import Request

from app.core.config import Settings
from app.core.errors import AppError
from app.core.request_id import current_request_id
from app.modules.auth.email_codes import EmailCodeService
from app.modules.auth.limits import RedisAttemptLimiter
from app.modules.auth.rbac import Permission, require_permissions
from app.modules.auth.service import AuthService
from app.modules.user.service import UserService

query = QueryType()
mutation = MutationType()


def _services(context: dict[str, Any]) -> tuple[AuthService, UserService]:
    cached_auth = context.get("auth_service")
    cached_users = context.get("user_service")
    if isinstance(cached_auth, AuthService) and isinstance(cached_users, UserService):
        return cached_auth, cached_users

    settings: Settings = context["settings"]
    session_factory = context.get("session_factory")
    if session_factory is None:
        raise AppError(
            code="DATABASE_NOT_CONFIGURED",
            message="Database session is not configured",
            status_code=503,
        )
    users = UserService(session_factory)
    return (
        AuthService(
            settings,
            users,
            email_codes=context.get("email_code_service"),
            login_limiter=context.get("login_limiter"),
        ),
        users,
    )


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
        email_code=input.get("emailCode"),
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
@require_permissions(Permission.PROFILE_READ)
async def me(_obj: Any, info: Any) -> dict[str, Any]:
    auth, _users = _services(info.context)
    user = await auth.current_user(info.context["request"])
    return {"code": 200, "message": "获取成功", "data": UserService.serialize(user)}


@mutation.field("updateMe")
@require_permissions(Permission.PROFILE_UPDATE)
async def update_me(_obj: Any, info: Any, input: dict[str, Any]) -> dict[str, Any]:
    auth, users = _services(info.context)
    current_user = await auth.current_user(info.context["request"])
    user = await users.update_current_user(current_user.id, input)
    return {"code": 200, "message": "更新成功", "data": UserService.serialize(user)}


@mutation.field("sendEmailCode")
async def send_email_code(_obj: Any, info: Any, email: str) -> dict[str, Any]:
    auth, _users = _services(info.context)
    await auth.send_email_code(email)
    return {"code": 200, "message": "验证码已发送", "data": None}


@mutation.field("emailLogin")
async def email_login(_obj: Any, info: Any, email: str, code: str) -> dict[str, Any]:
    auth, _users = _services(info.context)
    user, access_token = await auth.email_login(email=email, code=code)
    return {"code": 200, "message": "登录成功", "data": _auth_payload(access_token, user)}


@mutation.field("emailRegister")
async def email_register(
    _obj: Any,
    info: Any,
    email: str,
    code: str,
    password: str,
    role: str | None = None,
) -> dict[str, Any]:
    auth, _users = _services(info.context)
    user = await auth.email_register(email=email, code=code, password=password, role=role)
    return {"code": 200, "message": "注册成功", "data": user.id}


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
    runtime = request.app.state.runtime
    settings: Settings = request.app.state.settings
    session_factory = runtime.session_factory
    context: dict[str, Any] = {
        "request": request,
        "request_id": current_request_id(),
        "settings": settings,
        "session_factory": session_factory,
        "email_code_service": EmailCodeService(settings, runtime.redis, runtime.email_sender),
    }
    if runtime.redis is not None:
        context["login_limiter"] = RedisAttemptLimiter(
            runtime.redis,
            "login",
            settings.login_fail_max_count,
            settings.login_fail_lock_seconds,
        )
    if session_factory is not None:
        users = UserService(session_factory)
        context["user_service"] = users
        context["auth_service"] = AuthService(
            settings,
            users,
            email_codes=context["email_code_service"],
            login_limiter=context.get("login_limiter"),
        )
    return context


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
