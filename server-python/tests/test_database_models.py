from datetime import date
from decimal import Decimal

from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import Date, Numeric

from app.db import Base
from app.db.enums import HotelStatus

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


def test_model_metadata_covers_the_frozen_database_baseline() -> None:
    assert set(Base.metadata.tables) == EXPECTED_TABLES


def test_money_columns_preserve_decimal_precision() -> None:
    expected_scales = {
        ("hotels", "miniPrice"): (10, 2),
        ("hotels", "score"): (3, 2),
        ("room_types", "basePrice"): (10, 2),
        ("room_types", "area"): (6, 2),
        ("calendar_price", "price"): (10, 2),
        ("orders", "totalAmount"): (12, 2),
    }

    for (table_name, column_name), (precision, scale) in expected_scales.items():
        column_type = Base.metadata.tables[table_name].c[column_name].type
        assert isinstance(column_type, Numeric)
        assert column_type.asdecimal is True
        assert (column_type.precision, column_type.scale) == (precision, scale)

    assert Decimal("0.10") + Decimal("0.20") == Decimal("0.30")


def test_business_dates_use_database_date_columns() -> None:
    for table_name, column_name in (
        ("hotels", "openSince"),
        ("calendar_price", "date"),
        ("calendar_stock", "date"),
        ("orders", "checkIn"),
        ("orders", "checkOut"),
    ):
        assert isinstance(Base.metadata.tables[table_name].c[column_name].type, Date)

    leap_day = date.fromisoformat("2028-02-29")
    assert leap_day.isoformat() == "2028-02-29"


def test_head_schema_declares_relationship_and_range_guards() -> None:
    foreign_key_names = {
        constraint.name
        for table in Base.metadata.tables.values()
        for constraint in table.foreign_key_constraints
    }
    assert {
        "fk_calendar_price_room_type",
        "fk_calendar_stock_room_type",
        "fk_hotel_poi_hotel",
        "fk_hotel_poi_poi",
        "fk_orders_user",
        "fk_orders_hotel",
        "fk_orders_room_type",
    }.issubset(foreign_key_names)

    check_names = {
        constraint.name
        for table in Base.metadata.tables.values()
        for constraint in table.constraints
        if constraint.name is not None and str(constraint.name).startswith("ck_")
    }
    assert "ck_hotels_status_range" in check_names
    assert "ck_calendar_stock_stock_nonnegative" in check_names
    assert "ck_orders_stay_dates_ordered" in check_names
    assert list(HotelStatus) == [
        HotelStatus.DRAFT,
        HotelStatus.REVIEWING,
        HotelStatus.REJECTED,
        HotelStatus.PUBLISHED,
        HotelStatus.OFFLINE,
    ]


def test_alembic_has_one_linear_head() -> None:
    config = Config("alembic.ini")
    scripts = ScriptDirectory.from_config(config)

    assert scripts.get_heads() == ["20261008_0002"]
    assert scripts.get_revision("20261008_0002").down_revision == "20261008_0001"
