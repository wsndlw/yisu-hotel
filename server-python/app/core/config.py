import re
from datetime import datetime, timedelta
from functools import lru_cache
from pathlib import Path
from typing import Literal, Self

from pydantic import AnyHttpUrl, Field, RedisDsn, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL

JWT_DURATION_PATTERN = re.compile(r"^(?P<amount>[1-9][0-9]*)(?P<unit>[smhd])$")
JWT_DURATION_UNITS = {
    "s": 1,
    "m": 60,
    "h": 60 * 60,
    "d": 24 * 60 * 60,
}


class Settings(BaseSettings):
    """Validated runtime configuration. Sensitive values never have production defaults."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    environment: Literal["development", "test", "staging", "production"]
    app_name: str = "yisu-hotel-python"
    app_version: str = "0.1.0"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"

    db_host: str = Field(min_length=1)
    db_port: int = Field(ge=1, le=65535)
    db_user: str = Field(min_length=1)
    db_password: SecretStr = Field(min_length=1)
    db_name: str = Field(min_length=1, pattern=r"^[A-Za-z0-9_]+$")
    db_pool_size: int = Field(default=5, ge=1, le=50)
    db_echo: bool = False
    redis_url: RedisDsn

    jwt_secret: SecretStr = Field(min_length=32)
    jwt_expires_in: timedelta = Field(default=timedelta(days=7), gt=timedelta(0))
    jwt_issuer: str = Field(min_length=1)
    jwt_audience: str = Field(min_length=1)
    jwt_legacy_compatibility_enabled: bool = False
    jwt_legacy_compatibility_until: datetime | None = None

    cors_origins: list[AnyHttpUrl] = Field(min_length=1)
    graphql_schema_path: Path = Path("../docs/refactor/p1/baseline/schema.graphql")
    health_check_timeout_seconds: float = Field(default=2.0, gt=0, le=10)

    @field_validator("jwt_expires_in", mode="before")
    @classmethod
    def parse_jwt_duration(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        matched = JWT_DURATION_PATTERN.fullmatch(value.strip().lower())
        if matched is None:
            raise ValueError("JWT_EXPIRES_IN must use an integer followed by s, m, h, or d")
        amount = int(matched.group("amount"))
        seconds_per_unit = JWT_DURATION_UNITS[matched.group("unit")]
        return timedelta(seconds=amount * seconds_per_unit)

    @model_validator(mode="after")
    def reject_unsafe_production_configuration(self) -> Self:
        if self.jwt_legacy_compatibility_enabled and self.jwt_legacy_compatibility_until is None:
            raise ValueError(
                "JWT_LEGACY_COMPATIBILITY_UNTIL is required when legacy JWT "
                "compatibility is enabled"
            )
        if self.environment != "production":
            return self

        secret = self.jwt_secret.get_secret_value().lower()
        if "development" in secret or "change" in secret:
            raise ValueError("JWT_SECRET must not use the development placeholder in production")
        database_password = self.db_password.get_secret_value().lower()
        if "development" in database_password or "change" in database_password:
            raise ValueError("DB_PASSWORD must not use the development placeholder in production")
        if self.db_echo:
            raise ValueError("DB_ECHO must be disabled in production")
        return self

    @property
    def database_url(self) -> URL:
        return URL.create(
            drivername="mysql+asyncmy",
            username=self.db_user,
            password=self.db_password.get_secret_value(),
            host=self.db_host,
            port=self.db_port,
            database=self.db_name,
        )

    @property
    def docs_enabled(self) -> bool:
        return self.environment != "production"

    @property
    def cors_origin_strings(self) -> list[str]:
        return [str(origin).rstrip("/") for origin in self.cors_origins]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
