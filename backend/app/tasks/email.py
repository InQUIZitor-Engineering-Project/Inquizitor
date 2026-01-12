from __future__ import annotations

import logging
from typing import Any

from app.celery_app import celery_app

logger = logging.getLogger(__name__)


def _get_sender() -> Any:
    from app.bootstrap import get_container

    container = get_container()
    return container.provide_email_sender()


@celery_app.task(name="app.tasks.send_verification_email", bind=True)
def send_verification_email_task(
    self: Any, *, to_email: str, verify_url: str, expires_minutes: int
) -> dict[str, str]:
    _ = self
    sender = _get_sender()
    try:
        sender.send_verification_email(
            to_email=to_email,
            verify_url=verify_url,
            expires_minutes=expires_minutes,
        )
        return {"status": "sent"}
    except Exception as exc:
        logger.exception("Failed to send verification email to %s: %s", to_email, exc)
        raise


@celery_app.task(name="app.tasks.send_password_reset_email", bind=True)
def send_password_reset_email_task(
    self: Any, *, to_email: str, reset_url: str, expires_minutes: int
) -> dict[str, str]:
    _ = self
    sender = _get_sender()
    try:
        sender.send_password_reset_email(
            to_email=to_email,
            reset_url=reset_url,
            expires_minutes=expires_minutes,
        )
        return {"status": "sent"}
    except Exception as exc:
        logger.exception("Failed to send password reset email to %s: %s", to_email, exc)
        raise

@celery_app.task(name="app.tasks.send_support_notification", bind=True)
def send_support_notification_task(
    self: Any,
    *,
    to_email: str,
    ticket_id: int,
    user_email: str,
    category: str,
    subject: str,
    message: str,
    first_name: str | None = None,
    last_name: str | None = None,
) -> dict[str, str]:
    _ = self
    sender = _get_sender()
    try:
        sender.send_support_ticket_notification(
            to_email=to_email,
            ticket_id=ticket_id,
            user_email=user_email,
            category=category,
            subject=subject,
            message=message,
            first_name=first_name,
            last_name=last_name,
        )
        return {"status": "sent"}
    except Exception as exc:
        logger.exception(
            "Failed to send support notification for ticket #%s: %s",
            ticket_id,
            exc,
        )
        raise
