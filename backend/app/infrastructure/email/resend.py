from __future__ import annotations

import logging
from datetime import datetime
from pathlib import Path
from typing import Any, cast

import jinja2
import resend

from app.domain.services import EmailSender

logger = logging.getLogger(__name__)


class ResendEmailSender(EmailSender):
    def __init__(
        self,
        *,
        api_key: str,
        sender: str,
        frontend_url: str,
        logo_url: str | None = None,
    ) -> None:
        self._api_key = api_key
        self._sender = sender
        self._frontend_url = frontend_url.rstrip("/")
        # If logo_url is provided (e.g. from R2), use it.
        # Otherwise fallback to frontend assets.
        self._logo_url = logo_url or f"{self._frontend_url}/logo_book_square.png"
        resend.api_key = api_key

        # Setup Jinja2 environment
        template_dir = Path(__file__).parent / "templates"
        self._jinja_env = jinja2.Environment(
            loader=jinja2.FileSystemLoader(str(template_dir)),
            autoescape=jinja2.select_autoescape(["html", "xml"]),
        )

    def _render_template(self, template_name: str, **context: Any) -> str:
        template = self._jinja_env.get_template(template_name)
        return template.render(
            frontend_url=self._frontend_url,
            logo_url=self._logo_url,
            current_year=datetime.now().year,
            **context,
        )

    def _request(self, payload: dict[str, Any]) -> None:
        try:
            resend.Emails.send(cast(Any, payload))
        except Exception as exc:
            logger.exception("Resend email send failed: %s", exc)
            raise RuntimeError("Resend error") from exc

    def send_verification_email(
        self, *, to_email: str, verify_url: str, expires_minutes: int
    ) -> None:
        subject = "Potwierdź swój adres e-mail"
        html = self._render_template(
            "verification_email.html",
            verify_url=verify_url,
            expires_minutes=expires_minutes,
        )
        payload = {
            "from": self._sender,
            "to": [to_email],
            "subject": subject,
            "html": html,
        }
        self._request(payload)

    def send_password_reset_email(
        self, *, to_email: str, reset_url: str, expires_minutes: int
    ) -> None:
        subject = "Zresetuj swoje hasło"
        html = self._render_template(
            "password_reset_email.html",
            reset_url=reset_url,
            expires_minutes=expires_minutes,
        )
        payload = {
            "from": self._sender,
            "to": [to_email],
            "subject": subject,
            "html": html,
        }
        self._request(payload)

    def send_support_ticket_notification(
        self,
        *,
        to_email: str,
        ticket_id: int,
        user_email: str,
        category: str,
        subject: str,
        message: str,
        first_name: str | None = None,
        last_name: str | None = None,
    ) -> None:
        email_subject = f"[Support #{ticket_id}] {subject}"
        html = self._render_template(
            "support_notification.html",
            ticket_id=ticket_id,
            user_email=user_email,
            category=category,
            subject=subject,
            message=message,
            first_name=first_name,
            last_name=last_name,
        )
        payload = {
            "from": self._sender,
            "to": [to_email],
            "subject": email_subject,
            "html": html,
        }
        self._request(payload)


__all__ = ["ResendEmailSender"]
