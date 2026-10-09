from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

import bcrypt
import jwt
from jwt.exceptions import InvalidTokenError

from app.core.config import Settings
from app.core.errors import AppError


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=10)).decode("ascii")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("ascii"))
    except (ValueError, UnicodeEncodeError):
        return False


def issue_access_token(settings: Settings, user_id: str, role: str) -> str:
    issued_at = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": user_id,
        "role": role,
        "iat": issued_at,
        "exp": issued_at + settings.jwt_expires_in,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "jti": str(uuid4()),
    }
    return str(
        jwt.encode(
            payload,
            settings.jwt_secret.get_secret_value(),
            algorithm="HS256",
        )
    )


def _legacy_compatibility_is_active(settings: Settings) -> bool:
    cutoff = settings.jwt_legacy_compatibility_until
    if not settings.jwt_legacy_compatibility_enabled or cutoff is None:
        return False
    if cutoff.tzinfo is None:
        cutoff = cutoff.replace(tzinfo=UTC)
    return datetime.now(UTC) <= cutoff


def decode_access_token(settings: Settings, token: str) -> dict[str, Any]:
    secret = settings.jwt_secret.get_secret_value()
    try:
        return dict(
            jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                audience=settings.jwt_audience,
                issuer=settings.jwt_issuer,
                options={"require": ["sub", "exp", "iat", "iss", "aud", "jti"]},
            )
        )
    except InvalidTokenError as strict_error:
        if not _legacy_compatibility_is_active(settings):
            raise AppError(
                code="TOKEN_INVALID",
                message="登录状态已失效，请重新登录",
                status_code=401,
            ) from strict_error

        try:
            legacy_payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                options={
                    "verify_aud": False,
                    "verify_iss": False,
                    "require": ["sub", "exp"],
                },
            )
        except InvalidTokenError as legacy_error:
            raise AppError(
                code="TOKEN_INVALID",
                message="登录状态已失效，请重新登录",
                status_code=401,
            ) from legacy_error
        return dict(legacy_payload)


def bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise AppError(code="UNAUTHENTICATED", message="请先登录", status_code=401)
    scheme, separator, token = authorization.partition(" ")
    token = token.strip()
    if scheme.lower() != "bearer" or not separator or not token:
        raise AppError(code="UNAUTHENTICATED", message="请先登录", status_code=401)
    return token
