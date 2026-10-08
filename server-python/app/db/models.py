from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Column,
    Date,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Table,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.dialects.mysql import DATETIME, DOUBLE
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.enums import (
    FacilityCategory,
    FacilityType,
    HotelAuditAction,
    OrderStatus,
    UserRole,
)

TABLE_OPTIONS = {
    "mysql_engine": "InnoDB",
    "mysql_charset": "utf8mb4",
    "mysql_collate": "utf8mb4_unicode_ci",
}


def uuid_string() -> str:
    return str(uuid4())


def enum_values(
    enum_class: type[UserRole]
    | type[FacilityType]
    | type[FacilityCategory]
    | type[HotelAuditAction]
    | type[OrderStatus],
) -> list[str]:
    return [member.value for member in enum_class]


user_role_type = SqlEnum(
    UserRole,
    values_callable=enum_values,
    native_enum=True,
    create_constraint=False,
)
facility_type = SqlEnum(
    FacilityType,
    values_callable=enum_values,
    native_enum=True,
    create_constraint=False,
)
facility_category = SqlEnum(
    FacilityCategory,
    values_callable=enum_values,
    native_enum=True,
    create_constraint=False,
)
audit_action_type = SqlEnum(
    HotelAuditAction,
    values_callable=enum_values,
    native_enum=True,
    create_constraint=False,
)
order_status_type = SqlEnum(
    OrderStatus,
    values_callable=enum_values,
    native_enum=True,
    create_constraint=False,
)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        "createdAt",
        DATETIME(fsp=6),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP(6)"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt",
        DATETIME(fsp=6),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
    )


class User(TimestampMixin, Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("username", name="IDX_fe0bb3f6520ee0469504521e71"),
        UniqueConstraint("email", name="uq_users_email"),
        CheckConstraint("emailVerifyFailCount >= 0", name="email_verify_fail_count_nonnegative"),
        CheckConstraint("loginFailCount >= 0", name="login_fail_count_nonnegative"),
        TABLE_OPTIONS,
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    username: Mapped[str | None] = mapped_column(String(64))
    password_hash: Mapped[str] = mapped_column("passwordHash", String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        user_role_type,
        nullable=False,
        server_default=text("'CUSTOMER'"),
    )
    avatar_url: Mapped[str | None] = mapped_column("avatarUrl", String(512))
    preferred_tag_ids: Mapped[list[str] | None] = mapped_column("preferredTagIds", JSON)
    preferred_facility_ids: Mapped[list[str] | None] = mapped_column("preferredFacilityIds", JSON)
    email: Mapped[str | None] = mapped_column(String(255))
    email_verify_code: Mapped[str | None] = mapped_column("emailVerifyCode", String(6))
    email_verify_code_expiry: Mapped[datetime | None] = mapped_column(
        "emailVerifyCodeExpiry", DATETIME()
    )
    email_verify_fail_count: Mapped[int] = mapped_column(
        "emailVerifyFailCount", Integer, nullable=False, server_default=text("0")
    )
    email_verify_fail_lock_until: Mapped[datetime | None] = mapped_column(
        "emailVerifyFailLockUntil", DATETIME()
    )
    last_email_sent_at: Mapped[datetime | None] = mapped_column("lastEmailSentAt", DATETIME())
    login_fail_count: Mapped[int] = mapped_column(
        "loginFailCount", Integer, nullable=False, server_default=text("0")
    )
    login_fail_lock_until: Mapped[datetime | None] = mapped_column("loginFailLockUntil", DATETIME())

    hotels: Mapped[list[Hotel]] = relationship(back_populates="merchant")


class Facility(TimestampMixin, Base):
    __tablename__ = "facilities"
    __table_args__ = (
        Index("IDX_8f0d8306f4cacecf214682f425", "type"),
        Index("IDX_06bcfef94e04a223a5c4692193", "name"),
        TABLE_OPTIONS,
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("1"))
    type: Mapped[FacilityType] = mapped_column(
        facility_type,
        nullable=False,
        server_default=text("'FACILITY'"),
    )
    category: Mapped[FacilityCategory] = mapped_column(
        facility_category,
        nullable=False,
        server_default=text("'OTHER'"),
    )


hotel_facilities = Table(
    "hotel_facilities",
    Base.metadata,
    Column(
        "hotelId",
        String(36),
        ForeignKey(
            "hotels.id",
            name="FK_9c02c076c93425b2c73557675dd",
            ondelete="CASCADE",
            onupdate="CASCADE",
        ),
        primary_key=True,
    ),
    Column(
        "facilityId",
        String(36),
        ForeignKey(
            "facilities.id",
            name="FK_3cf78f1e3bc08b4d4baef19854d",
            ondelete="CASCADE",
            onupdate="CASCADE",
        ),
        primary_key=True,
    ),
    Index("IDX_9c02c076c93425b2c73557675d", "hotelId"),
    Index("IDX_3cf78f1e3bc08b4d4baef19854", "facilityId"),
    mysql_engine="InnoDB",
    mysql_charset="utf8mb4",
    mysql_collate="utf8mb4_unicode_ci",
)

hotel_tags = Table(
    "hotel_tags",
    Base.metadata,
    Column(
        "hotelId",
        String(36),
        ForeignKey(
            "hotels.id",
            name="FK_7a9876ba9effa98aeed29ce6af8",
            ondelete="CASCADE",
            onupdate="CASCADE",
        ),
        primary_key=True,
    ),
    Column(
        "tagId",
        String(36),
        ForeignKey(
            "facilities.id",
            name="FK_b6e59a8852917b8636d21cbb880",
            ondelete="CASCADE",
            onupdate="CASCADE",
        ),
        primary_key=True,
    ),
    Index("IDX_7a9876ba9effa98aeed29ce6af", "hotelId"),
    Index("IDX_b6e59a8852917b8636d21cbb88", "tagId"),
    mysql_engine="InnoDB",
    mysql_charset="utf8mb4",
    mysql_collate="utf8mb4_unicode_ci",
)


class Hotel(TimestampMixin, Base):
    __tablename__ = "hotels"
    __table_args__ = (
        UniqueConstraint("hotelID", name="IDX_c8d6c2af0d0c53616e0aa0b205"),
        Index("IDX_e3e6627bf975abd616a7914adc", "nameZh"),
        Index("IDX_0e86e173223d49cf5172f090f4", "address"),
        Index("IDX_a5d73d7c2ecb6ed217f86d512e", "city"),
        Index("IDX_51aca98d352a95e83820546d8d", "merchantId"),
        Index("IDX_ee42cdb53b92dfe0e87bf6c30d", "status"),
        Index("IDX_e711512051a47d677f7c2dfb89", "hasEverPublished"),
        CheckConstraint("status BETWEEN 0 AND 4", name="status_range"),
        CheckConstraint("starLevel IS NULL OR starLevel BETWEEN 0 AND 10", name="star_range"),
        CheckConstraint("miniPrice IS NULL OR miniPrice >= 0", name="mini_price_nonnegative"),
        CheckConstraint(
            "favoriteCount IS NULL OR favoriteCount >= 0", name="favorite_count_nonnegative"
        ),
        CheckConstraint("score IS NULL OR score BETWEEN 0 AND 5", name="score_range"),
        CheckConstraint("latitude IS NULL OR latitude BETWEEN -90 AND 90", name="latitude_range"),
        CheckConstraint(
            "longitude IS NULL OR longitude BETWEEN -180 AND 180", name="longitude_range"
        ),
        TABLE_OPTIONS,
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    name_zh: Mapped[str] = mapped_column("nameZh", String(128), nullable=False)
    name_en: Mapped[str | None] = mapped_column("nameEn", String(128))
    hotel_code: Mapped[str | None] = mapped_column("hotelID", String(32))
    address: Mapped[str | None] = mapped_column(String(255))
    latitude: Mapped[float | None] = mapped_column(DOUBLE(asdecimal=False))
    longitude: Mapped[float | None] = mapped_column(DOUBLE(asdecimal=False))
    city: Mapped[str | None] = mapped_column(String(64))
    star_level: Mapped[int | None] = mapped_column("starLevel", Integer)
    mini_price: Mapped[Decimal | None] = mapped_column(
        "miniPrice", Numeric(10, 2), server_default=text("0.00")
    )
    favorite_count: Mapped[int | None] = mapped_column(
        "favoriteCount", Integer, server_default=text("0")
    )
    open_since: Mapped[date | None] = mapped_column("openSince", Date)
    nearby: Mapped[list[str] | dict[str, Any] | None] = mapped_column(JSON)
    discount_info: Mapped[str | None] = mapped_column("discountInfo", Text)
    reject_reason: Mapped[str | None] = mapped_column("rejectReason", String(255))
    merchant_id: Mapped[str] = mapped_column(
        "merchantId",
        String(36),
        ForeignKey("users.id", name="FK_51aca98d352a95e83820546d8dc", ondelete="RESTRICT"),
        nullable=False,
    )
    status: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    score: Mapped[Decimal | None] = mapped_column(Numeric(3, 2), server_default=text("0.00"))
    has_ever_published: Mapped[bool] = mapped_column(
        "hasEverPublished", Boolean, nullable=False, server_default=text("0")
    )

    merchant: Mapped[User] = relationship(back_populates="hotels")
    room_types: Mapped[list[RoomType]] = relationship(
        back_populates="hotel", cascade="all, delete-orphan"
    )
    images: Mapped[list[HotelImage]] = relationship(
        back_populates="hotel", cascade="all, delete-orphan"
    )
    facilities: Mapped[list[Facility]] = relationship(secondary=hotel_facilities)
    tags: Mapped[list[Facility]] = relationship(secondary=hotel_tags)


class HotelImage(TimestampMixin, Base):
    __tablename__ = "hotel_images"
    __table_args__ = (
        Index("IDX_2f4f6a21d05e1af3616a63310c", "hotelId"),
        CheckConstraint("sortOrder >= 0", name="sort_order_nonnegative"),
        TABLE_OPTIONS,
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    hotel_id: Mapped[str] = mapped_column(
        "hotelId",
        String(36),
        ForeignKey("hotels.id", name="FK_2f4f6a21d05e1af3616a63310cd", ondelete="CASCADE"),
        nullable=False,
    )
    url: Mapped[str] = mapped_column(String(512), nullable=False)
    sort_order: Mapped[int] = mapped_column(
        "sortOrder", Integer, nullable=False, server_default=text("0")
    )

    hotel: Mapped[Hotel] = relationship(back_populates="images")


class RoomType(TimestampMixin, Base):
    __tablename__ = "room_types"
    __table_args__ = (
        Index("IDX_7ed42fc166559badb3c937c400", "hotelId"),
        CheckConstraint("basePrice >= 0", name="base_price_nonnegative"),
        CheckConstraint("maxGuests IS NULL OR maxGuests > 0", name="max_guests_positive"),
        CheckConstraint("stock IS NULL OR stock >= 0", name="stock_nonnegative"),
        CheckConstraint("area IS NULL OR area >= 0", name="area_nonnegative"),
        CheckConstraint("sortOrder >= 0", name="sort_order_nonnegative"),
        TABLE_OPTIONS,
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    hotel_id: Mapped[str] = mapped_column(
        "hotelId",
        String(36),
        ForeignKey("hotels.id", name="FK_7ed42fc166559badb3c937c400c", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    base_price: Mapped[Decimal] = mapped_column("basePrice", Numeric(10, 2), nullable=False)
    max_guests: Mapped[int | None] = mapped_column("maxGuests", Integer)
    bed_type: Mapped[str | None] = mapped_column("bedType", String(64))
    sort_order: Mapped[int] = mapped_column(
        "sortOrder", Integer, nullable=False, server_default=text("0")
    )
    stock: Mapped[int | None] = mapped_column(Integer)
    images: Mapped[str | None] = mapped_column(Text)
    is_on_sale: Mapped[bool | None] = mapped_column("isOnSale", Boolean)
    has_breakfast: Mapped[bool | None] = mapped_column("hasBreakfast", Boolean)
    refundable: Mapped[bool | None] = mapped_column(Boolean)
    area: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    floor: Mapped[str | None] = mapped_column(String(32))
    has_window: Mapped[bool | None] = mapped_column("hasWindow", Boolean)

    hotel: Mapped[Hotel] = relationship(back_populates="room_types")
    calendar_prices: Mapped[list[CalendarPrice]] = relationship(
        back_populates="room_type", cascade="all, delete-orphan"
    )
    calendar_stocks: Mapped[list[CalendarStock]] = relationship(
        back_populates="room_type", cascade="all, delete-orphan"
    )


class CalendarPrice(Base):
    __tablename__ = "calendar_price"
    __table_args__ = (
        UniqueConstraint("roomTypeId", "date", name="IDX_4c56db496f8cbf63d0bb9a1b69"),
        Index("IDX_6918dce453b9ebb7feb07f504b", "roomTypeId"),
        Index("IDX_aa387b1836ee6bd5c08e5aa03e", "date"),
        CheckConstraint("price >= 0", name="price_nonnegative"),
        TABLE_OPTIONS,
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    room_type_id: Mapped[str] = mapped_column(
        "roomTypeId",
        String(36),
        ForeignKey("room_types.id", name="fk_calendar_price_room_type", ondelete="CASCADE"),
        nullable=False,
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    room_type: Mapped[RoomType] = relationship(back_populates="calendar_prices")


class CalendarStock(Base):
    __tablename__ = "calendar_stock"
    __table_args__ = (
        UniqueConstraint("roomTypeId", "date", name="IDX_88dfbec853dad6e3711afcc3e2"),
        Index("IDX_0e04543939742d7754cd30c7fd", "roomTypeId"),
        Index("IDX_834b2d4f16de5d9cf31b2d32e9", "date"),
        CheckConstraint("stock >= 0", name="stock_nonnegative"),
        TABLE_OPTIONS,
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    room_type_id: Mapped[str] = mapped_column(
        "roomTypeId",
        String(36),
        ForeignKey("room_types.id", name="fk_calendar_stock_room_type", ondelete="CASCADE"),
        nullable=False,
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    stock: Mapped[int] = mapped_column(Integer, nullable=False)

    room_type: Mapped[RoomType] = relationship(back_populates="calendar_stocks")


class Poi(Base):
    __tablename__ = "poi"
    __table_args__ = (
        UniqueConstraint("name", "city", "type", name="IDX_89b73c4e2f40270e8d0eb2c20b"),
        Index("IDX_5176302ed375852aa4e9394d1b", "city"),
        Index("IDX_5a3a43efcbd9c282195330b0bc", "type"),
        CheckConstraint("latitude IS NULL OR latitude BETWEEN -90 AND 90", name="latitude_range"),
        CheckConstraint(
            "longitude IS NULL OR longitude BETWEEN -180 AND 180", name="longitude_range"
        ),
        CheckConstraint("baseScore >= 0", name="base_score_nonnegative"),
        TABLE_OPTIONS,
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    city: Mapped[str] = mapped_column(String(50), nullable=False)
    type: Mapped[str] = mapped_column(String(30), nullable=False)
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 6))
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 6))
    address: Mapped[str | None] = mapped_column(String(200))
    base_score: Mapped[Decimal] = mapped_column(
        "baseScore", Numeric(6, 2), nullable=False, server_default=text("0.00")
    )


class HotelPoi(Base):
    __tablename__ = "hotel_poi"
    __table_args__ = (
        UniqueConstraint("hotelId", "poiId", name="IDX_8c1c6c17168eeb4cd91070b281"),
        Index("IDX_a9bdeac65bb1144f6f570f37e6", "hotelId"),
        Index("IDX_50adb9c9ed2bddebea82f1940f", "poiId"),
        TABLE_OPTIONS,
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    hotel_id: Mapped[str] = mapped_column(
        "hotelId",
        String(36),
        ForeignKey("hotels.id", name="fk_hotel_poi_hotel", ondelete="CASCADE"),
        nullable=False,
    )
    poi_id: Mapped[str] = mapped_column(
        "poiId",
        String(36),
        ForeignKey("poi.id", name="fk_hotel_poi_poi", ondelete="CASCADE"),
        nullable=False,
    )


class Banner(TimestampMixin, Base):
    __tablename__ = "banners"
    __table_args__ = (
        Index("IDX_84ec62425a41f67f7c5798bc74", "targetHotelId"),
        Index("IDX_57b1dc6ab4fe6cda5275c219c1", "enabled"),
        Index("IDX_9089509136fbba025a0ce42450", "sort"),
        CheckConstraint("sort >= 0", name="sort_nonnegative"),
        CheckConstraint("endAt IS NULL OR startAt IS NULL OR endAt > startAt", name="time_window"),
        TABLE_OPTIONS,
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    title: Mapped[str] = mapped_column(String(64), nullable=False)
    image_url: Mapped[str] = mapped_column("imageUrl", String(512), nullable=False)
    target_hotel_id: Mapped[str] = mapped_column("targetHotelId", String(36), nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("1"))
    start_at: Mapped[datetime | None] = mapped_column("startAt", DATETIME())
    end_at: Mapped[datetime | None] = mapped_column("endAt", DATETIME())
    sort: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))


class HotelAuditRecord(Base):
    __tablename__ = "hotel_audit_records"
    __table_args__ = (
        Index("IDX_25759cb97c5508f3fb2039bcdf", "hotelId"),
        Index("ix_hotel_audit_records_operatorId", "operatorId"),
        TABLE_OPTIONS,
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    hotel_id: Mapped[str] = mapped_column(
        "hotelId",
        String(36),
        ForeignKey("hotels.id", name="fk_hotel_audit_records_hotel", ondelete="RESTRICT"),
        nullable=False,
    )
    action: Mapped[HotelAuditAction] = mapped_column(audit_action_type, nullable=False)
    reason: Mapped[str | None] = mapped_column(String(255))
    operator_id: Mapped[str | None] = mapped_column(
        "operatorId",
        String(36),
        ForeignKey("users.id", name="fk_hotel_audit_records_operator", ondelete="SET NULL"),
    )
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DATETIME(fsp=6), nullable=False, server_default=text("CURRENT_TIMESTAMP(6)")
    )


class Order(TimestampMixin, Base):
    __tablename__ = "orders"
    __table_args__ = (
        Index("IDX_151b79a83ba240b0cb31b2302d", "userId"),
        Index("IDX_1ead9162c81324002f59508242", "hotelId"),
        Index("IDX_4acf1e1512c59b79075757d934", "roomTypeId"),
        Index("IDX_775c9f06fc27ae3ff8fb26f2c4", "status"),
        Index("IDX_30e6836e8539f85bfc47198067", "userId", "createdAt"),
        CheckConstraint("checkOut > checkIn", name="stay_dates_ordered"),
        CheckConstraint("guestCount > 0", name="guest_count_positive"),
        CheckConstraint("totalAmount >= 0", name="total_amount_nonnegative"),
        TABLE_OPTIONS,
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    user_id: Mapped[str] = mapped_column(
        "userId",
        String(36),
        ForeignKey("users.id", name="fk_orders_user", ondelete="RESTRICT"),
        nullable=False,
    )
    hotel_id: Mapped[str] = mapped_column(
        "hotelId",
        String(36),
        ForeignKey("hotels.id", name="fk_orders_hotel", ondelete="RESTRICT"),
        nullable=False,
    )
    room_type_id: Mapped[str] = mapped_column(
        "roomTypeId",
        String(36),
        ForeignKey("room_types.id", name="fk_orders_room_type", ondelete="RESTRICT"),
        nullable=False,
    )
    hotel_name: Mapped[str] = mapped_column("hotelName", String(128), nullable=False)
    room_type_name: Mapped[str] = mapped_column("roomTypeName", String(64), nullable=False)
    check_in: Mapped[date] = mapped_column("checkIn", Date, nullable=False)
    check_out: Mapped[date] = mapped_column("checkOut", Date, nullable=False)
    guest_count: Mapped[int] = mapped_column("guestCount", Integer, nullable=False)
    guest_name: Mapped[str] = mapped_column("guestName", String(64), nullable=False)
    guest_phone: Mapped[str] = mapped_column("guestPhone", String(32), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column("totalAmount", Numeric(12, 2), nullable=False)
    inventory_dates: Mapped[list[str] | None] = mapped_column("inventoryDates", JSON)
    status: Mapped[OrderStatus] = mapped_column(
        order_status_type,
        nullable=False,
        server_default=text("'PENDING'"),
    )
