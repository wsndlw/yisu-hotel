from enum import IntEnum, StrEnum


class UserRole(StrEnum):
    CUSTOMER = "CUSTOMER"
    MERCHANT = "MERCHANT"
    ADMIN = "ADMIN"


class HotelStatus(IntEnum):
    DRAFT = 0
    REVIEWING = 1
    REJECTED = 2
    PUBLISHED = 3
    OFFLINE = 4


class FacilityType(StrEnum):
    TAG = "TAG"
    FACILITY = "FACILITY"


class FacilityCategory(StrEnum):
    BASIC = "BASIC"
    ROOM = "ROOM"
    DINING = "DINING"
    ENTERTAINMENT = "ENTERTAINMENT"
    BUSINESS = "BUSINESS"
    OTHER = "OTHER"


class HotelAuditAction(StrEnum):
    SUBMIT = "SUBMIT"
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    PUBLISH = "PUBLISH"
    OFFLINE = "OFFLINE"
    RESTORE = "RESTORE"
    WITHDRAW = "WITHDRAW"
    OFFLINE_REQUEST = "OFFLINE_REQUEST"


class OrderStatus(StrEnum):
    PENDING = "PENDING"
    PAID = "PAID"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"
