from __future__ import annotations

import asyncio
import json
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.core.config import get_settings
from app.db.session import create_database_engine

EXPECTED_REVISION = "20261008_0002"
EXPECTED_TABLES = {
    "banners",
    "calendar_price",
    "calendar_stock",
    "facilities",
    "hotel_audit_records",
    "hotel_facilities",
    "hotel_images",
    "hotel_poi",
    "hotel_tags",
    "hotels",
    "orders",
    "poi",
    "room_types",
    "users",
}


async def rows(connection: AsyncConnection, query: str, **parameters: object) -> list[Any]:
    result = await connection.execute(text(query), parameters)
    return list(result.mappings().all())


async def verify(connection: AsyncConnection, schema: str) -> dict[str, object]:
    revision_result = await connection.execute(text("SELECT version_num FROM alembic_version"))
    revision = str(revision_result.scalar_one())
    if revision != EXPECTED_REVISION:
        raise RuntimeError(f"expected Alembic revision {EXPECTED_REVISION}, found {revision}")

    table_rows = await rows(
        connection,
        """
        SELECT TABLE_NAME AS table_name
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = :schema AND TABLE_NAME <> 'alembic_version'
        """,
        schema=schema,
    )
    tables = {str(row["table_name"]) for row in table_rows}
    if tables != EXPECTED_TABLES:
        raise RuntimeError(
            f"business table mismatch: missing={sorted(EXPECTED_TABLES - tables)}, "
            f"extra={sorted(tables - EXPECTED_TABLES)}"
        )

    count_rows = await rows(
        connection,
        """
        SELECT 'banners' table_name, COUNT(*) row_count FROM banners
        UNION ALL SELECT 'calendar_price', COUNT(*) FROM calendar_price
        UNION ALL SELECT 'calendar_stock', COUNT(*) FROM calendar_stock
        UNION ALL SELECT 'facilities', COUNT(*) FROM facilities
        UNION ALL SELECT 'hotel_audit_records', COUNT(*) FROM hotel_audit_records
        UNION ALL SELECT 'hotel_facilities', COUNT(*) FROM hotel_facilities
        UNION ALL SELECT 'hotel_images', COUNT(*) FROM hotel_images
        UNION ALL SELECT 'hotel_poi', COUNT(*) FROM hotel_poi
        UNION ALL SELECT 'hotel_tags', COUNT(*) FROM hotel_tags
        UNION ALL SELECT 'hotels', COUNT(*) FROM hotels
        UNION ALL SELECT 'orders', COUNT(*) FROM orders
        UNION ALL SELECT 'poi', COUNT(*) FROM poi
        UNION ALL SELECT 'room_types', COUNT(*) FROM room_types
        UNION ALL SELECT 'users', COUNT(*) FROM users
        """,
    )
    counts = {str(row["table_name"]): int(row["row_count"]) for row in count_rows}

    orphan_result = await connection.execute(
        text(
            """
            SELECT COUNT(*) FROM (
              SELECT c.id FROM calendar_price c
              LEFT JOIN room_types r ON r.id = c.roomTypeId WHERE r.id IS NULL
              UNION ALL
              SELECT c.id FROM calendar_stock c
              LEFT JOIN room_types r ON r.id = c.roomTypeId WHERE r.id IS NULL
              UNION ALL
              SELECT o.id FROM orders o
              LEFT JOIN users u ON u.id = o.userId
              LEFT JOIN hotels h ON h.id = o.hotelId
              LEFT JOIN room_types r ON r.id = o.roomTypeId
              WHERE u.id IS NULL OR h.id IS NULL OR r.id IS NULL
            ) orphaned
            """
        )
    )
    orphan_relations = int(orphan_result.scalar_one())
    if orphan_relations != 0:
        raise RuntimeError(f"found {orphan_relations} orphan critical relationships")

    type_rows = await rows(
        connection,
        """
        SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name, COLUMN_TYPE AS column_type
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = :schema AND (
          (TABLE_NAME IN ('calendar_price', 'calendar_stock') AND COLUMN_NAME = 'date')
          OR (TABLE_NAME = 'orders' AND COLUMN_NAME IN ('checkIn', 'checkOut', 'totalAmount'))
          OR (TABLE_NAME = 'room_types' AND COLUMN_NAME = 'basePrice')
        )
        """,
        schema=schema,
    )
    column_types = {
        f"{row['table_name']}.{row['column_name']}": str(row["column_type"]).lower()
        for row in type_rows
    }
    expected_types = {
        "calendar_price.date": "date",
        "calendar_stock.date": "date",
        "orders.checkIn": "date",
        "orders.checkOut": "date",
        "orders.totalAmount": "decimal(12,2)",
        "room_types.basePrice": "decimal(10,2)",
    }
    if column_types != expected_types:
        raise RuntimeError(f"critical column type mismatch: {column_types}")

    constraint_rows = await rows(
        connection,
        """
        SELECT CONSTRAINT_TYPE AS constraint_type, COUNT(*) AS constraint_count
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = :schema
        GROUP BY CONSTRAINT_TYPE
        """,
        schema=schema,
    )

    return {
        "revision": revision,
        "tables": len(tables),
        "rowCounts": counts,
        "orphanCriticalRelationships": orphan_relations,
        "criticalColumnTypes": column_types,
        "constraints": {
            str(row["constraint_type"]): int(row["constraint_count"]) for row in constraint_rows
        },
    }


async def main() -> None:
    settings = get_settings()
    engine = create_database_engine(settings)
    try:
        async with engine.connect() as connection:
            report = await verify(connection, settings.db_name)
    finally:
        await engine.dispose()
    print(json.dumps(report, ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    asyncio.run(main())
