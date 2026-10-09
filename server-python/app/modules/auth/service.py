from __future__ import annotations

import hashlib
from typing import Any

from starlette.requests import Request

from app.core.config import Settings
from app.core.errors import AppError
from app.db.enums import UserRole
from app.db.models import User
from app.modules.auth.email_codes import EmailCodeService
from app.modules.auth.limits import RedisAttemptLimiter
from app.modules.auth.security import (
    bearer_token,
    decode_access_token,
    hash_password,
    issue_access_token,
    verify_password,
)
from app.modules.user.service import UserService


class AuthService:
    def __init__(
        self,
        settings: Settings,
        users: UserService,
        email_codes: EmailCodeService | None = None,
        login_limiter: RedisAttemptLimiter | None = None,
    ) -> None:
        self.settings = settings
        self.users = users
        self.email_codes = email_codes
        self.login_limiter = login_limiter

    async def register(
        self,
        *,
        username: Any,
        password: Any,
        role: Any = None,
        email: Any = None,
        email_code: Any = None,
    ) -> tuple[User, str]:
        normalized_username = str(username).strip()
        if not normalized_username or len(normalized_username) > 64:
            raise AppError(code="INVALID_USERNAME", message="用户名格式不正确", status_code=400)
        normalized_password = str(password)
        if len(normalized_password) < 6:
            raise AppError(code="INVALID_PASSWORD", message="密码至少 6 位", status_code=400)

        normalized_email: str | None = None
        if email is not None:
            if self.email_codes is None or email_code is None:
                raise AppError(
                    code="EMAIL_VERIFICATION_REQUIRED",
                    message="使用邮箱注册前请先完成验证码验证",
                    status_code=400,
                )
            normalized_email = await self.email_codes.verify_code(str(email), str(email_code))

        selected_role = self._registration_role(role)
        if await self.users.find_by_username(normalized_username) is not None:
            raise AppError(code="ACCOUNT_EXISTS", message="用户名已存在", status_code=409)

        user = await self.users.create_user(
            username=normalized_username,
            password_hash=hash_password(normalized_password),
            role=selected_role,
            email=normalized_email,
        )
        token = issue_access_token(self.settings, user.id, user.role.value)
        return user, token

    async def login(self, *, username: Any, password: Any) -> tuple[User, str]:
        normalized_username = str(username).strip()
        if self.login_limiter is not None:
            await self.login_limiter.ensure_available(normalized_username)
        user = await self.users.find_by_username(normalized_username)
        if user is None or not verify_password(str(password), user.password_hash):
            if self.login_limiter is not None:
                await self.login_limiter.record_failure(normalized_username)
            raise AppError(code="AUTH_INVALID", message="用户名或密码错误", status_code=401)

        if self.login_limiter is not None:
            await self.login_limiter.reset(normalized_username)

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

    async def send_email_code(self, email: str) -> None:
        if self.email_codes is None:
            raise AppError(
                code="EMAIL_DELIVERY_UNAVAILABLE",
                message="邮箱服务暂未配置",
                status_code=503,
            )
        await self.email_codes.send_code(email)

    async def email_login(self, *, email: str, code: str) -> tuple[User, str]:
        normalized_email = await self._verify_email_code(email, code)
        user = await self.users.find_by_email(normalized_email)
        if user is None:
            raise AppError(code="AUTH_INVALID", message="邮箱或验证码错误", status_code=401)
        token = issue_access_token(self.settings, user.id, user.role.value)
        return user, token

    async def email_register(
        self,
        *,
        email: str,
        code: str,
        password: str,
        role: Any = None,
    ) -> User:
        normalized_email = await self._verify_email_code(email, code)
        if await self.users.find_by_email(normalized_email) is not None:
            raise AppError(code="EMAIL_EXISTS", message="该邮箱已注册", status_code=409)
        normalized_password = str(password)
        if len(normalized_password) < 6:
            raise AppError(code="INVALID_PASSWORD", message="密码至少 6 位", status_code=400)
        selected_role = self._registration_role(role)
        username = self._email_username(normalized_email)
        if await self.users.find_by_username(username) is not None:
            raise AppError(code="ACCOUNT_EXISTS", message="账号已存在", status_code=409)
        return await self.users.create_user(
            username=username,
            password_hash=hash_password(normalized_password),
            role=selected_role,
            email=normalized_email,
        )

    async def _verify_email_code(self, email: str, code: str) -> str:
        if self.email_codes is None:
            raise AppError(
                code="AUTH_STORE_UNAVAILABLE",
                message="认证服务暂时不可用，请稍后重试",
                status_code=503,
            )
        return await self.email_codes.verify_code(email, code)

    @staticmethod
    def _email_username(email: str) -> str:
        if len(email) <= 64:
            return email
        return f"email-{hashlib.sha256(email.encode('utf-8')).hexdigest()[:48]}"

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
