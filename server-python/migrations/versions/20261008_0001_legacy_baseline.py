"""Create the P1 legacy schema baseline.

Revision ID: 20261008_0001
Revises: None
Create Date: 2026-10-08
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import mysql

revision: str = "20261008_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

TABLE_OPTIONS = {
    "mysql_engine": "InnoDB",
    "mysql_charset": "utf8mb4",
    "mysql_collate": "utf8mb4_unicode_ci",
}


def timestamps() -> tuple[sa.Column[sa.DateTime], sa.Column[sa.DateTime]]:
    return (
        sa.Column(
            "createdAt",
            mysql.DATETIME(fsp=6),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
        ),
        sa.Column(
            "updatedAt",
            mysql.DATETIME(fsp=6),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
        ),
    )


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("username", sa.String(64)),
        sa.Column("passwordHash", sa.String(255), nullable=False),
        sa.Column(
            "role",
            mysql.ENUM("CUSTOMER", "MERCHANT", "ADMIN"),
            nullable=False,
            server_default="CUSTOMER",
        ),
        sa.Column("avatarUrl", sa.String(512)),
        sa.Column("preferredTagIds", sa.JSON()),
        sa.Column("preferredFacilityIds", sa.JSON()),
        *timestamps(),
        sa.Column("email", sa.String(255)),
        sa.Column("emailVerifyCode", sa.String(6)),
        sa.Column("emailVerifyCodeExpiry", sa.DateTime()),
        sa.Column("emailVerifyFailCount", sa.Integer(), server_default="0"),
        sa.Column("emailVerifyFailLockUntil", sa.DateTime()),
        sa.Column("lastEmailSentAt", sa.DateTime()),
        sa.Column("loginFailCount", sa.Integer(), server_default="0"),
        sa.Column("loginFailLockUntil", sa.DateTime()),
        sa.PrimaryKeyConstraint("id"),
        **TABLE_OPTIONS,
    )
    op.create_index("IDX_fe0bb3f6520ee0469504521e71", "users", ["username"], unique=True)

    op.create_table(
        "facilities",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("name", sa.String(64), nullable=False),
        sa.Column("enabled", mysql.TINYINT(), nullable=False, server_default="1"),
        *timestamps(),
        sa.Column(
            "type",
            mysql.ENUM("TAG", "FACILITY"),
            nullable=False,
            server_default="FACILITY",
        ),
        sa.Column(
            "category",
            mysql.ENUM("BASIC", "ROOM", "DINING", "ENTERTAINMENT", "BUSINESS", "OTHER"),
            nullable=False,
            server_default="OTHER",
        ),
        sa.PrimaryKeyConstraint("id"),
        **TABLE_OPTIONS,
    )
    op.create_index("IDX_8f0d8306f4cacecf214682f425", "facilities", ["type"])
    op.create_index("IDX_06bcfef94e04a223a5c4692193", "facilities", ["name"])

    op.create_table(
        "hotels",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("nameZh", sa.String(128), nullable=False),
        sa.Column("nameEn", sa.String(128)),
        sa.Column("hotelID", sa.String(32)),
        sa.Column("address", sa.String(255)),
        sa.Column("latitude", mysql.DOUBLE(asdecimal=False)),
        sa.Column("longitude", mysql.DOUBLE(asdecimal=False)),
        sa.Column("city", sa.String(64)),
        sa.Column("starLevel", sa.Integer()),
        sa.Column("miniPrice", sa.Numeric(10, 2), server_default="0.00"),
        sa.Column("favoriteCount", sa.Integer(), server_default="0"),
        sa.Column("openSince", sa.Date()),
        sa.Column("nearby", sa.JSON()),
        sa.Column("discountInfo", sa.Text()),
        sa.Column("rejectReason", sa.String(255)),
        sa.Column("merchantId", sa.String(255), nullable=False),
        *timestamps(),
        sa.Column("status", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("score", sa.Numeric(3, 2), server_default="0.00"),
        sa.Column("hasEverPublished", mysql.TINYINT(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(
            ["merchantId"],
            ["users.id"],
            name="FK_51aca98d352a95e83820546d8dc",
        ),
        sa.PrimaryKeyConstraint("id"),
        **TABLE_OPTIONS,
    )
    op.create_index("IDX_c8d6c2af0d0c53616e0aa0b205", "hotels", ["hotelID"], unique=True)
    op.create_index("IDX_e3e6627bf975abd616a7914adc", "hotels", ["nameZh"])
    op.create_index("IDX_0e86e173223d49cf5172f090f4", "hotels", ["address"])
    op.create_index("IDX_a5d73d7c2ecb6ed217f86d512e", "hotels", ["city"])
    op.create_index("IDX_51aca98d352a95e83820546d8d", "hotels", ["merchantId"])
    op.create_index("IDX_ee42cdb53b92dfe0e87bf6c30d", "hotels", ["status"])
    op.create_index("IDX_e711512051a47d677f7c2dfb89", "hotels", ["hasEverPublished"])

    op.create_table(
        "room_types",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("hotelId", sa.String(255), nullable=False),
        sa.Column("name", sa.String(64), nullable=False),
        sa.Column("basePrice", sa.Numeric(10, 2), nullable=False),
        sa.Column("maxGuests", sa.Integer()),
        sa.Column("bedType", sa.String(64)),
        sa.Column("sortOrder", sa.Integer(), nullable=False, server_default="0"),
        *timestamps(),
        sa.Column("stock", sa.Integer()),
        sa.Column("images", sa.Text()),
        sa.Column("isOnSale", mysql.TINYINT()),
        sa.Column("hasBreakfast", mysql.TINYINT()),
        sa.Column("refundable", mysql.TINYINT()),
        sa.Column("area", sa.Numeric(6, 2)),
        sa.Column("floor", sa.String(32)),
        sa.Column("hasWindow", mysql.TINYINT()),
        sa.ForeignKeyConstraint(
            ["hotelId"],
            ["hotels.id"],
            name="FK_7ed42fc166559badb3c937c400c",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        **TABLE_OPTIONS,
    )
    op.create_index("IDX_7ed42fc166559badb3c937c400", "room_types", ["hotelId"])

    op.create_table(
        "hotel_images",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("hotelId", sa.String(255), nullable=False),
        sa.Column("url", sa.String(512), nullable=False),
        sa.Column("sortOrder", sa.Integer(), nullable=False, server_default="0"),
        *timestamps(),
        sa.ForeignKeyConstraint(
            ["hotelId"],
            ["hotels.id"],
            name="FK_2f4f6a21d05e1af3616a63310cd",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        **TABLE_OPTIONS,
    )
    op.create_index("IDX_2f4f6a21d05e1af3616a63310c", "hotel_images", ["hotelId"])

    op.create_table(
        "hotel_facilities",
        sa.Column("hotelId", sa.String(36), nullable=False),
        sa.Column("facilityId", sa.String(36), nullable=False),
        sa.ForeignKeyConstraint(
            ["facilityId"],
            ["facilities.id"],
            name="FK_3cf78f1e3bc08b4d4baef19854d",
            ondelete="CASCADE",
            onupdate="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["hotelId"],
            ["hotels.id"],
            name="FK_9c02c076c93425b2c73557675dd",
            ondelete="CASCADE",
            onupdate="CASCADE",
        ),
        sa.PrimaryKeyConstraint("hotelId", "facilityId"),
        **TABLE_OPTIONS,
    )
    op.create_index("IDX_9c02c076c93425b2c73557675d", "hotel_facilities", ["hotelId"])
    op.create_index("IDX_3cf78f1e3bc08b4d4baef19854", "hotel_facilities", ["facilityId"])

    op.create_table(
        "hotel_tags",
        sa.Column("hotelId", sa.String(36), nullable=False),
        sa.Column("tagId", sa.String(36), nullable=False),
        sa.ForeignKeyConstraint(
            ["hotelId"],
            ["hotels.id"],
            name="FK_7a9876ba9effa98aeed29ce6af8",
            ondelete="CASCADE",
            onupdate="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["tagId"],
            ["facilities.id"],
            name="FK_b6e59a8852917b8636d21cbb880",
            ondelete="CASCADE",
            onupdate="CASCADE",
        ),
        sa.PrimaryKeyConstraint("hotelId", "tagId"),
        **TABLE_OPTIONS,
    )
    op.create_index("IDX_7a9876ba9effa98aeed29ce6af", "hotel_tags", ["hotelId"])
    op.create_index("IDX_b6e59a8852917b8636d21cbb88", "hotel_tags", ["tagId"])

    op.create_table(
        "calendar_price",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("roomTypeId", sa.String(64), nullable=False),
        sa.Column("date", sa.String(10), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        **TABLE_OPTIONS,
    )
    op.create_index(
        "IDX_4c56db496f8cbf63d0bb9a1b69",
        "calendar_price",
        ["roomTypeId", "date"],
        unique=True,
    )
    op.create_index("IDX_6918dce453b9ebb7feb07f504b", "calendar_price", ["roomTypeId"])
    op.create_index("IDX_aa387b1836ee6bd5c08e5aa03e", "calendar_price", ["date"])

    op.create_table(
        "calendar_stock",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("roomTypeId", sa.String(64), nullable=False),
        sa.Column("date", sa.String(10), nullable=False),
        sa.Column("stock", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        **TABLE_OPTIONS,
    )
    op.create_index(
        "IDX_88dfbec853dad6e3711afcc3e2",
        "calendar_stock",
        ["roomTypeId", "date"],
        unique=True,
    )
    op.create_index("IDX_0e04543939742d7754cd30c7fd", "calendar_stock", ["roomTypeId"])
    op.create_index("IDX_834b2d4f16de5d9cf31b2d32e9", "calendar_stock", ["date"])

    op.create_table(
        "poi",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("city", sa.String(50), nullable=False),
        sa.Column("type", sa.String(30), nullable=False),
        sa.Column("latitude", sa.Numeric(10, 6)),
        sa.Column("longitude", sa.Numeric(10, 6)),
        sa.Column("address", sa.String(200)),
        sa.Column("baseScore", sa.Numeric(6, 2), nullable=False, server_default="0.00"),
        sa.PrimaryKeyConstraint("id"),
        **TABLE_OPTIONS,
    )
    op.create_index("IDX_89b73c4e2f40270e8d0eb2c20b", "poi", ["name", "city", "type"], unique=True)
    op.create_index("IDX_5176302ed375852aa4e9394d1b", "poi", ["city"])
    op.create_index("IDX_5a3a43efcbd9c282195330b0bc", "poi", ["type"])

    op.create_table(
        "hotel_poi",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("hotelId", sa.String(64), nullable=False),
        sa.Column("poiId", sa.String(64), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        **TABLE_OPTIONS,
    )
    op.create_index(
        "IDX_8c1c6c17168eeb4cd91070b281", "hotel_poi", ["hotelId", "poiId"], unique=True
    )
    op.create_index("IDX_a9bdeac65bb1144f6f570f37e6", "hotel_poi", ["hotelId"])
    op.create_index("IDX_50adb9c9ed2bddebea82f1940f", "hotel_poi", ["poiId"])

    op.create_table(
        "banners",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("title", sa.String(64), nullable=False),
        sa.Column("imageUrl", sa.String(512), nullable=False),
        sa.Column("targetHotelId", sa.String(255), nullable=False),
        sa.Column("enabled", mysql.TINYINT(), nullable=False, server_default="1"),
        sa.Column("startAt", sa.DateTime()),
        sa.Column("endAt", sa.DateTime()),
        *timestamps(),
        sa.Column("sort", sa.Integer(), nullable=False, server_default="0"),
        sa.PrimaryKeyConstraint("id"),
        **TABLE_OPTIONS,
    )
    op.create_index("IDX_84ec62425a41f67f7c5798bc74", "banners", ["targetHotelId"])
    op.create_index("IDX_57b1dc6ab4fe6cda5275c219c1", "banners", ["enabled"])
    op.create_index("IDX_9089509136fbba025a0ce42450", "banners", ["sort"])

    op.create_table(
        "hotel_audit_records",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("hotelId", sa.String(255), nullable=False),
        sa.Column(
            "action",
            mysql.ENUM(
                "SUBMIT",
                "APPROVE",
                "REJECT",
                "PUBLISH",
                "OFFLINE",
                "RESTORE",
                "WITHDRAW",
                "OFFLINE_REQUEST",
            ),
            nullable=False,
        ),
        sa.Column("reason", sa.String(255)),
        sa.Column("operatorId", sa.String(255)),
        sa.Column(
            "createdAt",
            mysql.DATETIME(fsp=6),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
        ),
        sa.PrimaryKeyConstraint("id"),
        **TABLE_OPTIONS,
    )
    op.create_index("IDX_25759cb97c5508f3fb2039bcdf", "hotel_audit_records", ["hotelId"])

    op.create_table(
        "orders",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("userId", sa.String(255), nullable=False),
        sa.Column("hotelId", sa.String(255), nullable=False),
        sa.Column("roomTypeId", sa.String(255), nullable=False),
        sa.Column("hotelName", sa.String(128), nullable=False),
        sa.Column("roomTypeName", sa.String(64), nullable=False),
        sa.Column("checkIn", sa.String(10), nullable=False),
        sa.Column("checkOut", sa.String(10), nullable=False),
        sa.Column("guestCount", sa.Integer(), nullable=False),
        sa.Column("guestName", sa.String(64), nullable=False),
        sa.Column("guestPhone", sa.String(32), nullable=False),
        sa.Column("totalAmount", sa.Numeric(12, 2), nullable=False),
        sa.Column("inventoryDates", sa.JSON()),
        sa.Column(
            "status",
            mysql.ENUM("PENDING", "PAID", "CANCELLED", "COMPLETED"),
            nullable=False,
            server_default="PENDING",
        ),
        *timestamps(),
        sa.PrimaryKeyConstraint("id"),
        **TABLE_OPTIONS,
    )
    op.create_index("IDX_151b79a83ba240b0cb31b2302d", "orders", ["userId"])
    op.create_index("IDX_1ead9162c81324002f59508242", "orders", ["hotelId"])
    op.create_index("IDX_4acf1e1512c59b79075757d934", "orders", ["roomTypeId"])
    op.create_index("IDX_775c9f06fc27ae3ff8fb26f2c4", "orders", ["status"])
    op.create_index("IDX_30e6836e8539f85bfc47198067", "orders", ["userId", "createdAt"])


def downgrade() -> None:
    for table_name in (
        "orders",
        "hotel_audit_records",
        "banners",
        "hotel_poi",
        "poi",
        "calendar_stock",
        "calendar_price",
        "hotel_tags",
        "hotel_facilities",
        "hotel_images",
        "room_types",
        "hotels",
        "facilities",
        "users",
    ):
        op.drop_table(table_name)
