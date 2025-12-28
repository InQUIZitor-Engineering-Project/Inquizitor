from __future__ import annotations

import logging

from app.celery_app import celery_app

logger = logging.getLogger(__name__)


def _get_sender():
    from app.bootstrap import get_container

    container = get_container()
    return container.provide_email_sender()


@celery_app.task(name="app.tasks.send_verification_email", bind=True)
def send_verification_email_task(self, *, to_email: str, verify_url: str, expires_minutes: int):
    sender = _get_sender()
    try:
        sender.send_verification_email(
            to_email=to_email,
            verify_url=verify_url,
            expires_minutes=expires_minutes,
        )
        return {"status": "sent"}
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to send verification email to %s: %s", to_email, exc)
        raise


@celery_app.task(name="app.tasks.send_password_reset_email", bind=True)
def send_password_reset_email_task(self, *, to_email: str, reset_url: str, expires_minutes: int):
    sender = _get_sender()
    try:
        sender.send_password_reset_email(
            to_email=to_email,
            reset_url=reset_url,
            expires_minutes=expires_minutes,
        )
        return {"status": "sent"}
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to send password reset email to %s: %s", to_email, exc)
        raise
