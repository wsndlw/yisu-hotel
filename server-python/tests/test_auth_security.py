from datetime import UTC, datetime, timedelta

import jwt
import pytest

from app.core.config import Settings
from app.core.errors import AppError
from app.modules.auth.security import (
    decode_access_token,
    hash_password,
    issue_access_token,
    verify_password,
)


def test_bcrypt_password_hash_is_compatible_and_never_verifies_plaintext(
    settings: Settings,
) -> None:
    password_hash = hash_password("TestOnly!2026")

    assert password_hash.startswith("$2b$")
    assert verify_password("TestOnly!2026", password_hash)
    assert not verify_password("wrong-password", password_hash)
    assert not verify_password("TestOnly!2026", "pending_verification")


def test_new_jwt_has_required_claims_and_decodes(settings: Settings) -> None:
    token = issue_access_token(settings, "user-1", "CUSTOMER")
    claims = decode_access_token(settings, token)

    assert claims["sub"] == "user-1"
    assert claims["role"] == "CUSTOMER"
    assert claims["iss"] == settings.jwt_issuer
    assert claims["aud"] == settings.jwt_audience
    assert claims["jti"]
    assert claims["exp"] > claims["iat"]


def test_legacy_jwt_is_only_accepted_inside_explicit_compatibility_window(
    settings: Settings,
) -> None:
    now = datetime.now(UTC)
    legacy_settings = settings.model_copy(
        update={
            "jwt_legacy_compatibility_enabled": True,
            "jwt_legacy_compatibility_until": now + timedelta(minutes=5),
        }
    )
    token = jwt.encode(
        {"sub": "legacy-user", "role": "MERCHANT", "iat": now, "exp": now + timedelta(minutes=5)},
        settings.jwt_secret.get_secret_value(),
        algorithm="HS256",
    )

    claims = decode_access_token(legacy_settings, token)
    assert claims["sub"] == "legacy-user"

    expired_compatibility = legacy_settings.model_copy(
        update={"jwt_legacy_compatibility_until": now - timedelta(seconds=1)}
    )
    with pytest.raises(AppError, match="登录状态已失效"):
        decode_access_token(expired_compatibility, token)
