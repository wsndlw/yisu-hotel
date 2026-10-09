from __future__ import annotations

from collections.abc import Awaitable, Callable, Collection
from dataclasses import dataclass
from enum import StrEnum
from functools import wraps
from typing import Any, cast

from app.core.errors import AppError
from app.db.enums import UserRole


class Permission(StrEnum):
    PROFILE_READ = "profile:read"
    PROFILE_UPDATE = "profile:update"
    ORDER_CREATE = "order:create"
    ORDER_READ_OWN = "order:read:own"
    ORDER_CANCEL_OWN = "order:cancel:own"
    HOTEL_CREATE = "hotel:create"
    HOTEL_READ_OWN = "hotel:read:own"
    HOTEL_UPDATE_OWN = "hotel:update:own"
    HOTEL_DELETE_OWN = "hotel:delete:own"
    HOTEL_SUBMIT = "hotel:submit"
    ROOM_MANAGE_OWN = "room:manage:own"
    CALENDAR_MANAGE_OWN = "calendar:manage:own"
    HOTEL_REVIEW = "hotel:review"
    HOTEL_PUBLISH = "hotel:publish"
    HOTEL_OFFLINE = "hotel:offline"
    HOTEL_RESTORE = "hotel:restore"
    FACILITY_MANAGE = "facility:manage"
    BANNER_MANAGE = "banner:manage"
    AUDIT_READ = "audit:read"


ROLE_PERMISSIONS: dict[UserRole, frozenset[Permission]] = {
    UserRole.CUSTOMER: frozenset(
        {
            Permission.PROFILE_READ,
            Permission.PROFILE_UPDATE,
            Permission.ORDER_CREATE,
            Permission.ORDER_READ_OWN,
            Permission.ORDER_CANCEL_OWN,
        }
    ),
    UserRole.MERCHANT: frozenset(
        {
            Permission.PROFILE_READ,
            Permission.PROFILE_UPDATE,
            Permission.HOTEL_CREATE,
            Permission.HOTEL_READ_OWN,
            Permission.HOTEL_UPDATE_OWN,
            Permission.HOTEL_DELETE_OWN,
            Permission.HOTEL_SUBMIT,
            Permission.ROOM_MANAGE_OWN,
            Permission.CALENDAR_MANAGE_OWN,
        }
    ),
    UserRole.ADMIN: frozenset(Permission),
}


@dataclass(frozen=True, slots=True)
class Principal:
    user_id: str
    role: UserRole


def require_authenticated(principal: Principal | None) -> Principal:
    if principal is None:
        raise AppError(code="UNAUTHENTICATED", message="请先登录", status_code=401)
    return principal


def require_roles(principal: Principal | None, *roles: UserRole) -> Principal:
    checked = require_authenticated(principal)
    if checked.role not in roles:
        raise AppError(code="FORBIDDEN", message="没有执行此操作的权限", status_code=403)
    return checked


def require_permission(principal: Principal | None, permission: Permission) -> Principal:
    checked = require_authenticated(principal)
    if permission not in ROLE_PERMISSIONS[checked.role]:
        raise AppError(code="FORBIDDEN", message="没有执行此操作的权限", status_code=403)
    return checked


def require_resource_owner(
    principal: Principal | None,
    owner_id: str,
    *,
    allow_admin: bool = True,
) -> Principal:
    checked = require_authenticated(principal)
    if checked.user_id != owner_id and not (allow_admin and checked.role is UserRole.ADMIN):
        raise AppError(code="FORBIDDEN", message="不能操作其他用户的资源", status_code=403)
    return checked


async def principal_from_context(context: dict[str, Any]) -> Principal:
    cached = context.get("principal")
    if isinstance(cached, Principal):
        return cached
    auth_service = context.get("auth_service")
    if auth_service is None:
        raise AppError(
            code="DATABASE_NOT_CONFIGURED",
            message="Database session is not configured",
            status_code=503,
        )
    user = await auth_service.current_user(context["request"])
    principal = Principal(user_id=user.id, role=user.role)
    context["principal"] = principal
    return principal


def require_permissions(
    *permissions: Permission,
    roles: Collection[UserRole] = (),
) -> Callable[[Callable[..., Awaitable[Any]]], Callable[..., Awaitable[Any]]]:
    def decorator(
        resolver: Callable[..., Awaitable[Any]],
    ) -> Callable[..., Awaitable[Any]]:
        @wraps(resolver)
        async def guarded(parent: Any, info: Any, *args: Any, **kwargs: Any) -> Any:
            principal = await principal_from_context(info.context)
            if roles:
                require_roles(principal, *roles)
            for permission in permissions:
                require_permission(principal, permission)
            return await resolver(parent, info, *args, **kwargs)

        return cast(Callable[..., Awaitable[Any]], guarded)

    return decorator
