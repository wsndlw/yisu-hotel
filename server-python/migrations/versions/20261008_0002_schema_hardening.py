"""Harden identifiers, business dates, relationships, and value constraints.

Revision ID: 20261008_0002
Revises: 20261008_0001
Create Date: 2026-10-08
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import context, op

revision: str = "20261008_0002"
down_revision: str | None = "20261008_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def reject_rows(query: str, message: str) -> None:
    if context.is_offline_mode():
        return
    count = op.get_bind().execute(sa.text(query)).scalar_one()
    if int(count) > 0:
        raise RuntimeError(f"P3 migration preflight failed: {message} ({count} row(s))")


def preflight() -> None:
    reject_rows(
        """
        SELECT COUNT(*) FROM (
          SELECT email FROM users WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1
        ) AS duplicate_emails
        """,
        "users.email contains duplicates",
    )

    identifier_columns = {
        "hotels": ("merchantId",),
        "room_types": ("hotelId",),
        "hotel_images": ("hotelId",),
        "banners": ("targetHotelId",),
        "hotel_audit_records": ("hotelId", "operatorId"),
        "hotel_poi": ("hotelId", "poiId"),
        "calendar_price": ("roomTypeId",),
        "calendar_stock": ("roomTypeId",),
        "orders": ("userId", "hotelId", "roomTypeId"),
    }
    for table, columns in identifier_columns.items():
        for column in columns:
            reject_rows(
                f"SELECT COUNT(*) FROM `{table}` WHERE `{column}` IS NOT NULL "
                f"AND CHAR_LENGTH(`{column}`) > 36",
                f"{table}.{column} contains an identifier longer than 36 characters",
            )

    for table, columns in {
        "calendar_price": ("date",),
        "calendar_stock": ("date",),
        "orders": ("checkIn", "checkOut"),
    }.items():
        for column in columns:
            reject_rows(
                f"SELECT COUNT(*) FROM `{table}` WHERE STR_TO_DATE(`{column}`, '%Y-%m-%d') "
                f"IS NULL OR DATE_FORMAT(STR_TO_DATE(`{column}`, '%Y-%m-%d'), '%Y-%m-%d') "
                f"<> `{column}`",
                f"{table}.{column} contains a non-ISO or invalid business date",
            )

    orphan_checks = (
        (
            "SELECT COUNT(*) FROM calendar_price c LEFT JOIN room_types r "
            "ON r.id = c.roomTypeId WHERE r.id IS NULL",
            "calendar_price has orphan roomTypeId values",
        ),
        (
            "SELECT COUNT(*) FROM calendar_stock c LEFT JOIN room_types r "
            "ON r.id = c.roomTypeId WHERE r.id IS NULL",
            "calendar_stock has orphan roomTypeId values",
        ),
        (
            "SELECT COUNT(*) FROM hotel_poi hp LEFT JOIN hotels h "
            "ON h.id = hp.hotelId WHERE h.id IS NULL",
            "hotel_poi has orphan hotelId values",
        ),
        (
            "SELECT COUNT(*) FROM hotel_poi hp LEFT JOIN poi p "
            "ON p.id = hp.poiId WHERE p.id IS NULL",
            "hotel_poi has orphan poiId values",
        ),
        (
            "SELECT COUNT(*) FROM hotel_audit_records a LEFT JOIN hotels h "
            "ON h.id = a.hotelId WHERE h.id IS NULL",
            "hotel_audit_records has orphan hotelId values",
        ),
        (
            "SELECT COUNT(*) FROM hotel_audit_records a LEFT JOIN users u "
            "ON u.id = a.operatorId WHERE a.operatorId IS NOT NULL AND u.id IS NULL",
            "hotel_audit_records has orphan operatorId values",
        ),
        (
            "SELECT COUNT(*) FROM orders o LEFT JOIN users u ON u.id = o.userId WHERE u.id IS NULL",
            "orders has orphan userId values",
        ),
        (
            "SELECT COUNT(*) FROM orders o LEFT JOIN hotels h ON h.id = o.hotelId "
            "WHERE h.id IS NULL",
            "orders has orphan hotelId values",
        ),
        (
            "SELECT COUNT(*) FROM orders o LEFT JOIN room_types r ON r.id = o.roomTypeId "
            "WHERE r.id IS NULL",
            "orders has orphan roomTypeId values",
        ),
    )
    for query, message in orphan_checks:
        reject_rows(query, message)

    value_checks = (
        ("SELECT COUNT(*) FROM hotels WHERE status NOT BETWEEN 0 AND 4", "invalid hotel status"),
        (
            "SELECT COUNT(*) FROM hotels WHERE starLevel IS NOT NULL "
            "AND starLevel NOT BETWEEN 0 AND 10",
            "invalid hotel star level",
        ),
        (
            "SELECT COUNT(*) FROM hotels WHERE (miniPrice IS NOT NULL AND miniPrice < 0) "
            "OR (favoriteCount IS NOT NULL AND favoriteCount < 0) "
            "OR (score IS NOT NULL AND score NOT BETWEEN 0 AND 5)",
            "invalid hotel price, favorite count, or score",
        ),
        (
            "SELECT COUNT(*) FROM room_types WHERE basePrice < 0 "
            "OR (maxGuests IS NOT NULL AND maxGuests <= 0) "
            "OR (stock IS NOT NULL AND stock < 0) OR sortOrder < 0 "
            "OR (area IS NOT NULL AND area < 0)",
            "invalid room type numeric value",
        ),
        ("SELECT COUNT(*) FROM calendar_price WHERE price < 0", "negative calendar price"),
        ("SELECT COUNT(*) FROM calendar_stock WHERE stock < 0", "negative calendar stock"),
        (
            "SELECT COUNT(*) FROM orders WHERE guestCount <= 0 OR totalAmount < 0 "
            "OR checkOut <= checkIn",
            "invalid order guest count, amount, or stay range",
        ),
    )
    for query, message in value_checks:
        reject_rows(query, message)


def upgrade() -> None:
    preflight()

    op.execute("UPDATE users SET emailVerifyFailCount = 0 WHERE emailVerifyFailCount IS NULL")
    op.execute("UPDATE users SET loginFailCount = 0 WHERE loginFailCount IS NULL")

    op.drop_constraint("FK_51aca98d352a95e83820546d8dc", "hotels", type_="foreignkey")
    op.drop_constraint("FK_7ed42fc166559badb3c937c400c", "room_types", type_="foreignkey")
    op.drop_constraint("FK_2f4f6a21d05e1af3616a63310cd", "hotel_images", type_="foreignkey")

    identifier_columns = {
        "hotels": (("merchantId", 255),),
        "room_types": (("hotelId", 255),),
        "hotel_images": (("hotelId", 255),),
        "banners": (("targetHotelId", 255),),
        "hotel_audit_records": (("hotelId", 255), ("operatorId", 255)),
        "hotel_poi": (("hotelId", 64), ("poiId", 64)),
        "calendar_price": (("roomTypeId", 64),),
        "calendar_stock": (("roomTypeId", 64),),
        "orders": (("userId", 255), ("hotelId", 255), ("roomTypeId", 255)),
    }
    for table, columns in identifier_columns.items():
        for column, old_length in columns:
            op.alter_column(
                table,
                column,
                existing_type=sa.String(old_length),
                type_=sa.String(36),
                existing_nullable=column == "operatorId",
            )

    for table, column in (
        ("calendar_price", "date"),
        ("calendar_stock", "date"),
        ("orders", "checkIn"),
        ("orders", "checkOut"),
    ):
        op.alter_column(
            table,
            column,
            existing_type=sa.String(10),
            type_=sa.Date(),
            existing_nullable=False,
        )

    op.alter_column(
        "users",
        "emailVerifyFailCount",
        existing_type=sa.Integer(),
        nullable=False,
        existing_server_default=sa.text("0"),
    )
    op.alter_column(
        "users",
        "loginFailCount",
        existing_type=sa.Integer(),
        nullable=False,
        existing_server_default=sa.text("0"),
    )

    op.create_unique_constraint("uq_users_email", "users", ["email"])
    op.create_index("ix_hotel_audit_records_operatorId", "hotel_audit_records", ["operatorId"])

    op.create_foreign_key(
        "FK_51aca98d352a95e83820546d8dc",
        "hotels",
        "users",
        ["merchantId"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "FK_7ed42fc166559badb3c937c400c",
        "room_types",
        "hotels",
        ["hotelId"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "FK_2f4f6a21d05e1af3616a63310cd",
        "hotel_images",
        "hotels",
        ["hotelId"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_calendar_price_room_type",
        "calendar_price",
        "room_types",
        ["roomTypeId"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_calendar_stock_room_type",
        "calendar_stock",
        "room_types",
        ["roomTypeId"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_hotel_poi_hotel",
        "hotel_poi",
        "hotels",
        ["hotelId"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_hotel_poi_poi",
        "hotel_poi",
        "poi",
        ["poiId"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_hotel_audit_records_hotel",
        "hotel_audit_records",
        "hotels",
        ["hotelId"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_hotel_audit_records_operator",
        "hotel_audit_records",
        "users",
        ["operatorId"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_orders_user", "orders", "users", ["userId"], ["id"], ondelete="RESTRICT"
    )
    op.create_foreign_key(
        "fk_orders_hotel", "orders", "hotels", ["hotelId"], ["id"], ondelete="RESTRICT"
    )
    op.create_foreign_key(
        "fk_orders_room_type",
        "orders",
        "room_types",
        ["roomTypeId"],
        ["id"],
        ondelete="RESTRICT",
    )

    checks = (
        ("users", "ck_users_email_verify_fail_count_nonnegative", "emailVerifyFailCount >= 0"),
        ("users", "ck_users_login_fail_count_nonnegative", "loginFailCount >= 0"),
        ("hotels", "ck_hotels_status_range", "status BETWEEN 0 AND 4"),
        (
            "hotels",
            "ck_hotels_star_range",
            "starLevel IS NULL OR starLevel BETWEEN 0 AND 10",
        ),
        (
            "hotels",
            "ck_hotels_mini_price_nonnegative",
            "miniPrice IS NULL OR miniPrice >= 0",
        ),
        (
            "hotels",
            "ck_hotels_favorite_count_nonnegative",
            "favoriteCount IS NULL OR favoriteCount >= 0",
        ),
        ("hotels", "ck_hotels_score_range", "score IS NULL OR score BETWEEN 0 AND 5"),
        (
            "hotels",
            "ck_hotels_latitude_range",
            "latitude IS NULL OR latitude BETWEEN -90 AND 90",
        ),
        (
            "hotels",
            "ck_hotels_longitude_range",
            "longitude IS NULL OR longitude BETWEEN -180 AND 180",
        ),
        ("hotel_images", "ck_hotel_images_sort_order_nonnegative", "sortOrder >= 0"),
        ("room_types", "ck_room_types_base_price_nonnegative", "basePrice >= 0"),
        (
            "room_types",
            "ck_room_types_max_guests_positive",
            "maxGuests IS NULL OR maxGuests > 0",
        ),
        (
            "room_types",
            "ck_room_types_stock_nonnegative",
            "stock IS NULL OR stock >= 0",
        ),
        ("room_types", "ck_room_types_area_nonnegative", "area IS NULL OR area >= 0"),
        ("room_types", "ck_room_types_sort_order_nonnegative", "sortOrder >= 0"),
        ("calendar_price", "ck_calendar_price_price_nonnegative", "price >= 0"),
        ("calendar_stock", "ck_calendar_stock_stock_nonnegative", "stock >= 0"),
        (
            "poi",
            "ck_poi_latitude_range",
            "latitude IS NULL OR latitude BETWEEN -90 AND 90",
        ),
        (
            "poi",
            "ck_poi_longitude_range",
            "longitude IS NULL OR longitude BETWEEN -180 AND 180",
        ),
        ("poi", "ck_poi_base_score_nonnegative", "baseScore >= 0"),
        ("banners", "ck_banners_sort_nonnegative", "sort >= 0"),
        (
            "banners",
            "ck_banners_time_window",
            "endAt IS NULL OR startAt IS NULL OR endAt > startAt",
        ),
        ("orders", "ck_orders_stay_dates_ordered", "checkOut > checkIn"),
        ("orders", "ck_orders_guest_count_positive", "guestCount > 0"),
        ("orders", "ck_orders_total_amount_nonnegative", "totalAmount >= 0"),
    )
    for table, name, condition in checks:
        op.create_check_constraint(name, table, condition)


def downgrade() -> None:
    checks = (
        ("orders", "ck_orders_total_amount_nonnegative"),
        ("orders", "ck_orders_guest_count_positive"),
        ("orders", "ck_orders_stay_dates_ordered"),
        ("banners", "ck_banners_time_window"),
        ("banners", "ck_banners_sort_nonnegative"),
        ("poi", "ck_poi_base_score_nonnegative"),
        ("poi", "ck_poi_longitude_range"),
        ("poi", "ck_poi_latitude_range"),
        ("calendar_stock", "ck_calendar_stock_stock_nonnegative"),
        ("calendar_price", "ck_calendar_price_price_nonnegative"),
        ("room_types", "ck_room_types_sort_order_nonnegative"),
        ("room_types", "ck_room_types_area_nonnegative"),
        ("room_types", "ck_room_types_stock_nonnegative"),
        ("room_types", "ck_room_types_max_guests_positive"),
        ("room_types", "ck_room_types_base_price_nonnegative"),
        ("hotel_images", "ck_hotel_images_sort_order_nonnegative"),
        ("hotels", "ck_hotels_longitude_range"),
        ("hotels", "ck_hotels_latitude_range"),
        ("hotels", "ck_hotels_score_range"),
        ("hotels", "ck_hotels_favorite_count_nonnegative"),
        ("hotels", "ck_hotels_mini_price_nonnegative"),
        ("hotels", "ck_hotels_star_range"),
        ("hotels", "ck_hotels_status_range"),
        ("users", "ck_users_login_fail_count_nonnegative"),
        ("users", "ck_users_email_verify_fail_count_nonnegative"),
    )
    for table, name in checks:
        op.drop_constraint(name, table, type_="check")

    foreign_keys = (
        ("orders", "fk_orders_room_type"),
        ("orders", "fk_orders_hotel"),
        ("orders", "fk_orders_user"),
        ("hotel_audit_records", "fk_hotel_audit_records_operator"),
        ("hotel_audit_records", "fk_hotel_audit_records_hotel"),
        ("hotel_poi", "fk_hotel_poi_poi"),
        ("hotel_poi", "fk_hotel_poi_hotel"),
        ("calendar_stock", "fk_calendar_stock_room_type"),
        ("calendar_price", "fk_calendar_price_room_type"),
        ("hotel_images", "FK_2f4f6a21d05e1af3616a63310cd"),
        ("room_types", "FK_7ed42fc166559badb3c937c400c"),
        ("hotels", "FK_51aca98d352a95e83820546d8dc"),
    )
    for table, name in foreign_keys:
        op.drop_constraint(name, table, type_="foreignkey")

    op.drop_index("ix_hotel_audit_records_operatorId", table_name="hotel_audit_records")
    op.drop_constraint("uq_users_email", "users", type_="unique")

    for table, column in (
        ("calendar_price", "date"),
        ("calendar_stock", "date"),
        ("orders", "checkIn"),
        ("orders", "checkOut"),
    ):
        op.alter_column(
            table,
            column,
            existing_type=sa.Date(),
            type_=sa.String(10),
            existing_nullable=False,
        )

    identifier_columns = {
        "hotels": (("merchantId", 255),),
        "room_types": (("hotelId", 255),),
        "hotel_images": (("hotelId", 255),),
        "banners": (("targetHotelId", 255),),
        "hotel_audit_records": (("hotelId", 255), ("operatorId", 255)),
        "hotel_poi": (("hotelId", 64), ("poiId", 64)),
        "calendar_price": (("roomTypeId", 64),),
        "calendar_stock": (("roomTypeId", 64),),
        "orders": (("userId", 255), ("hotelId", 255), ("roomTypeId", 255)),
    }
    for table, columns in identifier_columns.items():
        for column, old_length in columns:
            op.alter_column(
                table,
                column,
                existing_type=sa.String(36),
                type_=sa.String(old_length),
                existing_nullable=column == "operatorId",
            )

    op.alter_column(
        "users",
        "emailVerifyFailCount",
        existing_type=sa.Integer(),
        nullable=True,
        existing_server_default=sa.text("0"),
    )
    op.alter_column(
        "users",
        "loginFailCount",
        existing_type=sa.Integer(),
        nullable=True,
        existing_server_default=sa.text("0"),
    )

    op.create_foreign_key(
        "FK_51aca98d352a95e83820546d8dc",
        "hotels",
        "users",
        ["merchantId"],
        ["id"],
    )
    op.create_foreign_key(
        "FK_7ed42fc166559badb3c937c400c",
        "room_types",
        "hotels",
        ["hotelId"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "FK_2f4f6a21d05e1af3616a63310cd",
        "hotel_images",
        "hotels",
        ["hotelId"],
        ["id"],
        ondelete="CASCADE",
    )
