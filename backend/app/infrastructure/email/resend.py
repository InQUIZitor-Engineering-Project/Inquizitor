from __future__ import annotations

import logging
from typing import Any, Dict

import resend

from app.domain.services import EmailSender

logger = logging.getLogger(__name__)


class ResendEmailSender(EmailSender):
    def __init__(self, *, api_key: str, sender: str) -> None:
        self._api_key = api_key
        self._sender = sender
        resend.api_key = api_key

    def _request(self, payload: Dict[str, Any]) -> None:
        try:
            resend.Emails.send(payload)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Resend email send failed: %s", exc)
            raise RuntimeError("Resend error") from exc

    def send_verification_email(self, *, to_email: str, verify_url: str, expires_minutes: int) -> None:
        subject = "Potwierdź swój adres e-mail"
        html = (
            "<p>Cześć!</p>"
            "<p>Aby dokończyć rejestrację, kliknij w link poniżej:</p>"
            f"<p><a href=\"{verify_url}\">{verify_url}</a></p>"
            f"<p>Link wygaśnie za {expires_minutes} minut.</p>"
            "<p>Jeśli to nie Ty zakładałeś konto, zignoruj tę wiadomość.</p>"
        )
        payload = {
            "from": self._sender,
            "to": [to_email],
            "subject": subject,
            "html": html,
        }
        self._request(payload)


__all__ = ["ResendEmailSender"]
