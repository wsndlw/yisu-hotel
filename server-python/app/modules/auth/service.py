from __future__ import annotations

from typing import Any

from starlette.requests import Request

from app.core.config import Settings
from app.core.errors import AppError
from app.db.enums import UserRole
from app.db.models import User
from app.modules.auth.security import (
    bearer_token,
    decode_access_token,
    hash_password,
    issue_access_token,
    verify_password,
)
from app.modules.user.service import UserService


class AuthService:
    def __init__(self, settings: Settings, users: UserService) -> None:
        self.settings = settings
        self.users = users

    async def register(
        self,
        *,
        username: Any,
        password: Any,
        role: Any = None,
        email: Any = None,
    ) -> tuple[User, str]:
        normalized_username = str(username).strip()
        if not normalized_username or len(normalized_username) > 64:
            raise AppError(code="INVALID_USERNAME", message="用户名格式不正确", status_code=400)
        normalized_password = str(password)
        if len(normalized_password) < 6:
            raise AppError(code="INVALID_PASSWORD", message="密码至少 6 位", status_code=400)

        selected_role = self._registration_role(role)
        if await self.users.find_by_username(normalized_username) is not None:
            raise AppError(code="ACCOUNT_EXISTS", message="用户名已存在", status_code=409)

        user = await self.users.create_user(
            username=normalized_username,
            password_hash=hash_password(normalized_password),
            role=selected_role,
            email=str(email).strip() if email else None,
        )
        token = issue_access_token(self.settings, user.id, user.role.value)
        return user, token

    async def login(self, *, username: Any, password: Any) -> tuple[User, str]:
        normalized_username = str(username).strip()
        user = await self.users.find_by_username(normalized_username)
        if user is None or not verify_password(str(password), user.password_hash):
            raise AppError(code="AUTH_INVALID", message="用户名或密码错误", status_code=401)

        token = issue_access_token(self.settings, user.id, user.role.value)
        return user, token

    async def current_user(self, request: Request) -> User:
        token = bearer_token(request.headers.get("authorization"))
        payload = decode_access_token(self.settings, token)
        subject = payload.get("sub")
        if not isinstance(subject, str) or not subject:
            raise AppError(
                code="TOKEN_INVALID", message="登录状态已失效，请重新登录", status_code=401
            )
        user = await self.users.find_by_id(subject)
        if user is None:
            raise AppError(
                code="TOKEN_INVALID", message="登录状态已失效，请重新登录", status_code=401
            )
        return user

    @staticmethod
    def _registration_role(role: Any) -> UserRole:
        if role is None:
            return UserRole.CUSTOMER
        try:
            selected_role = UserRole(str(role))
        except ValueError as error:
            raise AppError(code="INVALID_ROLE", message="角色不合法", status_code=400) from error
        if selected_role is UserRole.ADMIN:
            raise AppError(
                code="ADMIN_REGISTRATION_FORBIDDEN",
                message="管理员不能通过公开注册创建",
                status_code=403,
            )
        return selected_role
