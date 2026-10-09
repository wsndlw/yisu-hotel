from __future__ import annotations

import argparse
import asyncio
import getpass
import sys

from app.core.config import get_settings
from app.core.errors import AppError
from app.core.logging import configure_logging
from app.db.session import create_database_engine, create_session_factory
from app.modules.auth.admin import AdminProvisioningService
from app.modules.user.service import UserService

CONFIRM_TOKEN = "CREATE_ADMIN"  # noqa: S105 - explicit workflow confirmation, not a secret
PRODUCTION_CONFIRM_TOKEN = "I_UNDERSTAND_PRODUCTION_ADMIN_BOOTSTRAP"  # noqa: S105


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Create an administrator through the audited operational path."
    )
    parser.add_argument("--username", required=True)
    parser.add_argument("--email")
    parser.add_argument(
        "--actor", required=True, help="Human/operator identity recorded in audit logs"
    )
    parser.add_argument(
        "--reason", required=True, help="Ticket or change reason recorded in audit logs"
    )
    parser.add_argument(
        "--confirm",
        required=True,
        help=f"Must equal {CONFIRM_TOKEN}",
    )
    parser.add_argument(
        "--confirm-production",
        default="",
        help=f"Required in production: {PRODUCTION_CONFIRM_TOKEN}",
    )
    parser.add_argument(
        "--password-stdin",
        action="store_true",
        help="Read the administrator password from stdin instead of an interactive prompt",
    )
    return parser


def read_password(password_stdin: bool) -> str:
    if password_stdin:
        password = sys.stdin.readline().rstrip("\r\n")
        if not password:
            raise AppError(
                code="ADMIN_PASSWORD_REQUIRED", message="必须提供管理员密码", status_code=400
            )
        return password
    password = getpass.getpass("New administrator password: ")
    confirmation = getpass.getpass("Repeat administrator password: ")
    if password != confirmation:
        raise AppError(
            code="ADMIN_PASSWORD_MISMATCH",
            message="两次输入的管理员密码不一致",
            status_code=400,
        )
    return password


async def run(args: argparse.Namespace) -> None:
    settings = get_settings()
    if args.confirm != CONFIRM_TOKEN:
        raise AppError(
            code="ADMIN_CONFIRMATION_REQUIRED",
            message="缺少管理员创建确认",
            status_code=400,
        )
    if settings.environment == "production" and args.confirm_production != PRODUCTION_CONFIRM_TOKEN:
        raise AppError(
            code="ADMIN_PRODUCTION_CONFIRMATION_REQUIRED",
            message="生产环境需要额外的管理员创建确认",
            status_code=400,
        )

    password = read_password(args.password_stdin)
    engine = create_database_engine(settings)
    try:
        users = UserService(create_session_factory(engine))
        user = await AdminProvisioningService(users).create_admin(
            username=args.username,
            password=password,
            actor=args.actor,
            reason=args.reason,
            email=args.email,
        )
        print(f"Created admin user {user.id} ({user.username}); audit event emitted.")
    finally:
        await engine.dispose()


def main() -> None:
    args = build_parser().parse_args()
    try:
        settings = get_settings()
        configure_logging(settings.log_level)
        asyncio.run(run(args))
    except AppError as error:
        print(f"Admin creation failed: {error.message}", file=sys.stderr)
        raise SystemExit(1) from error


if __name__ == "__main__":
    main()
