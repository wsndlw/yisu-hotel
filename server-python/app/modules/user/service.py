from __future__ import annotations

from collections.abc import Mapping
from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.errors import AppError
from app.db.enums import UserRole
from app.db.models import User
from app.modules.auth.security import hash_password


class UserService:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self.session_factory = session_factory

    async def find_by_id(self, user_id: str) -> User | None:
        async with self.session_factory() as session:
            return await session.scalar(select(User).where(User.id == user_id))

    async def find_by_username(self, username: str) -> User | None:
        async with self.session_factory() as session:
            return await session.scalar(select(User).where(User.username == username))

    async def find_by_email(self, email: str) -> User | None:
        async with self.session_factory() as session:
            return await session.scalar(select(User).where(User.email == email))

    async def create_user(
        self,
        *,
        username: str,
        password_hash: str,
        role: UserRole,
        email: str | None = None,
    ) -> User:
        user = User(username=username, password_hash=password_hash, role=role, email=email)
        async with self.session_factory() as session:
            session.add(user)
            try:
                await session.commit()
            except IntegrityError as error:
                await session.rollback()
                raise AppError(
                    code="ACCOUNT_EXISTS",
                    message="用户名已存在",
                    status_code=409,
                ) from error
            await session.refresh(user)
        return user

    async def update_current_user(self, user_id: str, patch: Mapping[str, Any]) -> User:
        async with self.session_factory() as session:
            user = await session.scalar(select(User).where(User.id == user_id))
            if user is None:
                raise AppError(code="USER_NOT_FOUND", message="用户不存在", status_code=404)

            username = patch.get("username")
            if username is not None:
                username = str(username).strip()
                if not username or len(username) > 64:
                    raise AppError(
                        code="INVALID_USERNAME", message="用户名格式不正确", status_code=400
                    )
                duplicate = await session.scalar(
                    select(User).where(User.username == username, User.id != user_id)
                )
                if duplicate is not None:
                    raise AppError(code="ACCOUNT_EXISTS", message="用户名已存在", status_code=409)
                user.username = username

            password = patch.get("password")
            if password is not None:
                password = str(password)
                if len(password) < 6:
                    raise AppError(
                        code="INVALID_PASSWORD", message="密码至少 6 位", status_code=400
                    )
                user.password_hash = hash_password(password)

            if "avatarUrl" in patch:
                user.avatar_url = patch["avatarUrl"]
            if "preferredTagIds" in patch:
                user.preferred_tag_ids = patch["preferredTagIds"]
            if "preferredFacilityIds" in patch:
                user.preferred_facility_ids = patch["preferredFacilityIds"]

            try:
                await session.commit()
            except IntegrityError as error:
                await session.rollback()
                raise AppError(
                    code="ACCOUNT_EXISTS",
                    message="用户名已存在",
                    status_code=409,
                ) from error
            await session.refresh(user)
            return user

    @staticmethod
    def serialize(user: User) -> dict[str, Any]:
        def iso(value: datetime | None) -> str | None:
            return value.isoformat() if value is not None else None

        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "avatarUrl": user.avatar_url,
            "preferredTagIds": user.preferred_tag_ids,
            "preferredFacilityIds": user.preferred_facility_ids,
            "role": user.role.value,
            "createdAt": iso(user.created_at),
            "updatedAt": iso(user.updated_at),
        }
