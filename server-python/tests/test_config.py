from datetime import timedelta
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def valid_values() -> dict[str, object]:
    return {
        "environment": "test",
        "db_host": "localhost",
        "db_port": 3306,
        "db_user": "test",
        "db_password": "test",
        "db_name": "yisu_test",
        "db_pool_size": 5,
        "db_echo": False,
        "redis_url": "redis://localhost:6379/15",
        "jwt_secret": "test-only-secret-with-at-least-thirty-two-characters",
        "jwt_expires_in": "7d",
        "jwt_issuer": "yisu-test",
        "jwt_audience": "yisu-test-clients",
        "cors_origins": ["http://localhost:5173"],
        "graphql_schema_path": Path("schema.graphql"),
    }


def test_required_configuration_names_are_reported(monkeypatch: pytest.MonkeyPatch) -> None:
    required = {
        "ENVIRONMENT",
        "DB_HOST",
        "DB_PORT",
        "DB_USER",
        "DB_PASSWORD",
        "DB_NAME",
        "REDIS_URL",
        "JWT_SECRET",
        "JWT_ISSUER",
        "JWT_AUDIENCE",
        "CORS_ORIGINS",
    }
    for name in required:
        monkeypatch.delenv(name, raising=False)

    with pytest.raises(ValidationError) as raised:
        Settings(_env_file=None)

    missing = {str(error["loc"][0]).upper() for error in raised.value.errors()}
    assert required <= missing


def test_database_configuration_is_typed_and_builds_async_url() -> None:
    values = valid_values()
    values["db_port"] = "invalid"

    with pytest.raises(ValidationError, match="db_port"):
        Settings(_env_file=None, **values)  # type: ignore[arg-type]

    values["db_port"] = 3306
    settings = Settings(_env_file=None, **values)  # type: ignore[arg-type]
    assert settings.database_url.drivername == "mysql+asyncmy"
    assert settings.database_url.render_as_string(hide_password=False) == (
        "mysql+asyncmy://test:test@localhost:3306/yisu_test"
    )
    assert settings.jwt_expires_in == timedelta(days=7)


def test_invalid_jwt_duration_is_rejected() -> None:
    values = valid_values()
    values["jwt_expires_in"] = "seven-days"

    with pytest.raises(ValidationError, match="JWT_EXPIRES_IN"):
        Settings(_env_file=None, **values)  # type: ignore[arg-type]


def test_production_rejects_development_jwt_secret() -> None:
    values = valid_values()
    values["environment"] = "production"
    values["jwt_secret"] = "local-development-only-change-before-production"

    with pytest.raises(ValidationError, match="development placeholder"):
        Settings(_env_file=None, **values)  # type: ignore[arg-type]


def test_production_disables_api_documentation() -> None:
    values = valid_values()
    values["environment"] = "production"
    values["jwt_secret"] = "a-secure-production-shaped-secret-value"
    settings = Settings(_env_file=None, **values)  # type: ignore[arg-type]

    assert settings.docs_enabled is False
    assert settings.cors_origin_strings == ["http://localhost:5173"]


def test_production_rejects_database_echo() -> None:
    values = valid_values()
    values["environment"] = "production"
    values["jwt_secret"] = "a-secure-production-shaped-secret-value"
    values["db_echo"] = True

    with pytest.raises(ValidationError, match="DB_ECHO"):
        Settings(_env_file=None, **values)  # type: ignore[arg-type]


def test_production_rejects_development_database_password() -> None:
    values = valid_values()
    values["environment"] = "production"
    values["jwt_secret"] = "a-secure-production-shaped-secret-value"
    values["db_password"] = "local-development-only"

    with pytest.raises(ValidationError, match="DB_PASSWORD"):
        Settings(_env_file=None, **values)  # type: ignore[arg-type]
