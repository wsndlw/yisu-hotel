from __future__ import annotations

import asyncio
from dataclasses import dataclass

from alembic import command
from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import get_settings


@dataclass(frozen=True)
class InvalidValueCase:
    name: str
    set_invalid_sql: str
    restore_valid_sql: str
    expected_message: str


INVALID_VALUE_CASES = (
    InvalidValueCase(
        "hotel latitude",
        "UPDATE hotels SET latitude = 999 WHERE id = 'preflight-hotel'",
        "UPDATE hotels SET latitude = 31.2304 WHERE id = 'preflight-hotel'",
        "invalid hotel latitude",
    ),
    InvalidValueCase(
        "hotel longitude",
        "UPDATE hotels SET longitude = 999 WHERE id = 'preflight-hotel'",
        "UPDATE hotels SET longitude = 121.4737 WHERE id = 'preflight-hotel'",
        "invalid hotel longitude",
    ),
    InvalidValueCase(
        "POI latitude",
        "UPDATE poi SET latitude = 999 WHERE id = 'preflight-poi'",
        "UPDATE poi SET latitude = 31.2304 WHERE id = 'preflight-poi'",
        "invalid POI latitude",
    ),
    InvalidValueCase(
        "POI longitude",
        "UPDATE poi SET longitude = 999 WHERE id = 'preflight-poi'",
        "UPDATE poi SET longitude = 121.4737 WHERE id = 'preflight-poi'",
        "invalid POI longitude",
    ),
    InvalidValueCase(
        "POI base score",
        "UPDATE poi SET baseScore = -1 WHERE id = 'preflight-poi'",
        "UPDATE poi SET baseScore = 0 WHERE id = 'preflight-poi'",
        "negative POI base score",
    ),
    InvalidValueCase(
        "email verification failure count",
        "UPDATE users SET emailVerifyFailCount = -1 WHERE id = 'preflight-user'",
        "UPDATE users SET emailVerifyFailCount = 0 WHERE id = 'preflight-user'",
        "negative user email verification failure count",
    ),
    InvalidValueCase(
        "login failure count",
        "UPDATE users SET loginFailCount = -1 WHERE id = 'preflight-user'",
        "UPDATE users SET loginFailCount = 0 WHERE id = 'preflight-user'",
        "negative user login failure count",
    ),
    InvalidValueCase(
        "hotel image sort order",
        "UPDATE hotel_images SET sortOrder = -1 WHERE id = 'preflight-image'",
        "UPDATE hotel_images SET sortOrder = 0 WHERE id = 'preflight-image'",
        "negative hotel image sort order",
    ),
    InvalidValueCase(
        "banner sort order",
        "UPDATE banners SET sort = -1 WHERE id = 'preflight-banner'",
        "UPDATE banners SET sort = 0 WHERE id = 'preflight-banner'",
        "negative banner sort order",
    ),
    InvalidValueCase(
        "banner time window",
        "UPDATE banners SET startAt = '2026-10-08 12:00:00', "
        "endAt = '2026-10-08 12:00:00' WHERE id = 'preflight-banner'",
        "UPDATE banners SET startAt = '2026-10-08 12:00:00', "
        "endAt = '2026-10-09 12:00:00' WHERE id = 'preflight-banner'",
        "invalid banner time window",
    ),
)

FIXTURE_INSERTS = (
    "INSERT INTO users (id, passwordHash, emailVerifyFailCount, loginFailCount) "
    "VALUES ('preflight-user', 'not-a-real-password-hash', 0, 0)",
    "INSERT INTO hotels (id, nameZh, merchantId, latitude, longitude) "
    "VALUES ('preflight-hotel', 'preflight hotel', 'preflight-user', 31.2304, 121.4737)",
    "INSERT INTO hotel_images (id, hotelId, url, sortOrder) "
    "VALUES ('preflight-image', 'preflight-hotel', 'https://example.invalid/image', 0)",
    "INSERT INTO poi (id, name, city, type, latitude, longitude, baseScore) "
    "VALUES ('preflight-poi', 'preflight poi', 'Shanghai', 'test', 31.2304, 121.4737, 0)",
    "INSERT INTO banners (id, title, imageUrl, targetHotelId, sort, startAt, endAt) "
    "VALUES ('preflight-banner', 'preflight banner', 'https://example.invalid/banner', "
    "'preflight-hotel', 0, '2026-10-08 12:00:00', '2026-10-09 12:00:00')",
)

FIXTURE_DELETES = (
    "DELETE FROM hotel_images WHERE id = 'preflight-image'",
    "DELETE FROM banners WHERE id = 'preflight-banner'",
    "DELETE FROM poi WHERE id = 'preflight-poi'",
    "DELETE FROM hotels WHERE id = 'preflight-hotel'",
    "DELETE FROM users WHERE id = 'preflight-user'",
)

SCHEMA_SNAPSHOT_QUERIES = (
    "SELECT version_num FROM alembic_version ORDER BY version_num",
    "SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COALESCE(COLUMN_DEFAULT, ''), "
    "EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() "
    "ORDER BY TABLE_NAME, ORDINAL_POSITION",
    "SELECT TABLE_NAME, CONSTRAINT_NAME, CONSTRAINT_TYPE FROM "
    "information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() "
    "ORDER BY TABLE_NAME, CONSTRAINT_NAME",
    "SELECT TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX, COLUMN_NAME, NON_UNIQUE FROM "
    "information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() "
    "ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX",
)


async def execute_statements(statements: tuple[str, ...]) -> None:
    engine = create_async_engine(get_settings().database_url, poolclass=NullPool)
    try:
        async with engine.begin() as connection:
            for statement in statements:
                await connection.execute(text(statement))
    finally:
        await engine.dispose()


async def schema_snapshot() -> tuple[tuple[tuple[str, ...], ...], ...]:
    engine = create_async_engine(get_settings().database_url, poolclass=NullPool)
    snapshots: list[tuple[tuple[str, ...], ...]] = []
    try:
        async with engine.connect() as connection:
            for query in SCHEMA_SNAPSHOT_QUERIES:
                result = await connection.execute(text(query))
                snapshots.append(
                    tuple(
                        tuple("" if value is None else str(value) for value in row)
                        for row in result
                    )
                )
    finally:
        await engine.dispose()
    return tuple(snapshots)


async def assert_database_is_empty() -> None:
    engine = create_async_engine(get_settings().database_url, poolclass=NullPool)
    try:
        async with engine.connect() as connection:
            table_count = await connection.scalar(
                text(
                    "SELECT COUNT(*) FROM information_schema.TABLES "
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'"
                )
            )
    finally:
        await engine.dispose()

    if int(table_count or 0) != 0:
        raise RuntimeError("Preflight integration verification requires a dedicated empty database")


def assert_preflight_rejects_without_ddl(
    config: Config,
    case: InvalidValueCase,
) -> None:
    asyncio.run(execute_statements((case.set_invalid_sql,)))
    before = asyncio.run(schema_snapshot())

    try:
        command.upgrade(config, "head")
    except RuntimeError as error:
        if case.expected_message not in str(error):
            raise AssertionError(f"{case.name}: unexpected preflight error: {error}") from error
    else:
        raise AssertionError(f"{case.name}: migration accepted an invalid value")

    after = asyncio.run(schema_snapshot())
    if after != before:
        raise AssertionError(f"{case.name}: schema changed after preflight rejection")

    asyncio.run(execute_statements((case.restore_valid_sql,)))


def main() -> None:
    config = Config("alembic.ini")
    asyncio.run(assert_database_is_empty())
    command.upgrade(config, "20261008_0001")
    asyncio.run(execute_statements(FIXTURE_INSERTS))

    for case in INVALID_VALUE_CASES:
        assert_preflight_rejects_without_ddl(config, case)

    asyncio.run(execute_statements(FIXTURE_DELETES))
    command.upgrade(config, "head")
    print(
        f"Verified {len(INVALID_VALUE_CASES)} invalid-value preflight cases; "
        "all failures occurred before DDL and the clean baseline upgraded to head."
    )


if __name__ == "__main__":
    main()
