from __future__ import annotations

import asyncio
import smtplib
from email.message import EmailMessage
from typing import Protocol

from app.core.config import Settings


class EmailSender(Protocol):
    async def send_verification_code(self, email: str, code: str, ttl_seconds: int) -> None: ...


class SmtpEmailSender:
    def __init__(self, settings: Settings) -> None:
        if not settings.email_host or not settings.email_from:
            raise ValueError("SMTP email delivery requires EMAIL_HOST and EMAIL_FROM")
        self.host = settings.email_host
        self.port = settings.email_port
        self.user = settings.email_user
        self.password = (
            settings.email_password.get_secret_value()
            if settings.email_password is not None
            else None
        )
        self.sender = settings.email_from
        self.secure = settings.email_secure

    async def send_verification_code(self, email: str, code: str, ttl_seconds: int) -> None:
        await asyncio.to_thread(self._send, email, code, ttl_seconds)

    def _send(self, email: str, code: str, ttl_seconds: int) -> None:
        message = EmailMessage()
        message["From"] = self.sender
        message["To"] = email
        message["Subject"] = "易宿酒店验证码"
        message.set_content(
            f"您的易宿酒店验证码是 {code}，有效期 {ttl_seconds // 60} 分钟。"
            "请勿将验证码透露给他人。"
        )

        if self.secure:
            with smtplib.SMTP_SSL(self.host, self.port, timeout=10) as client:
                self._authenticate(client)
                client.send_message(message)
            return

        with smtplib.SMTP(self.host, self.port, timeout=10) as client:
            client.starttls()
            self._authenticate(client)
            client.send_message(message)

    def _authenticate(self, client: smtplib.SMTP) -> None:
        if self.user and self.password:
            client.login(self.user, self.password)


def create_email_sender(settings: Settings) -> EmailSender | None:
    if not settings.email_delivery_enabled:
        return None
    return SmtpEmailSender(settings)
