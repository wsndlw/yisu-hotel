from __future__ import annotations

import structlog

from app.core.errors import AppError
from app.db.enums import UserRole
from app.db.models import User
from app.modules.auth.security import hash_password
from app.modules.user.service import UserService

logger = structlog.get_logger("app.auth.admin")


class AdminProvisioningService:
    """Provision an administrator through an audited operational path only."""

    def __init__(self, users: UserService) -> None:
        self.users = users

    async def create_admin(
        self,
        *,
        username: str,
        password: str,
        actor: str,
        reason: str,
        email: str | None = None,
    ) -> User:
        normalized_username = username.strip()
        normalized_actor = actor.strip()
        normalized_reason = reason.strip()
        if not normalized_username or len(normalized_username) > 64:
            raise AppError(code="INVALID_USERNAME", message="用户名格式不正确", status_code=400)
        if len(password) < 12:
            raise AppError(
                code="ADMIN_PASSWORD_WEAK",
                message="管理员密码至少 12 位",
                status_code=400,
            )
        if not normalized_actor or len(normalized_actor) > 128:
            raise AppError(code="INVALID_ADMIN_ACTOR", message="创建人标识不正确", status_code=400)
        if not normalized_reason or len(normalized_reason) > 255:
            raise AppError(code="INVALID_ADMIN_REASON", message="创建原因不正确", status_code=400)
        if await self.users.find_by_username(normalized_username) is not None:
            raise AppError(
                code="ADMIN_ALREADY_EXISTS",
                message="管理员账号已存在",
                status_code=409,
            )

        try:
            user = await self.users.create_user(
                username=normalized_username,
                password_hash=hash_password(password),
                role=UserRole.ADMIN,
                email=email.strip().lower() if email else None,
            )
        except AppError as error:
            if error.code in {"ACCOUNT_EXISTS", "EMAIL_EXISTS"}:
                raise AppError(
                    code="ADMIN_ALREADY_EXISTS",
                    message="管理员账号已存在",
                    status_code=409,
                ) from error
            raise

        logger.info(
            "admin_account_created",
            admin_user_id=user.id,
            username=user.username,
            actor=normalized_actor,
            reason=normalized_reason,
        )
        return user
