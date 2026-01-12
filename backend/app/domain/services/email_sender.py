from __future__ import annotations

from typing import Protocol


class EmailSender(Protocol):
    def send_verification_email(
        self, *, to_email: str, verify_url: str, expires_minutes: int
    ) -> None:
        """
        Send a verification email containing a magic link.
        Should raise an exception on failure.
        """

    def send_password_reset_email(
        self, *, to_email: str, reset_url: str, expires_minutes: int
    ) -> None:
        """
        Send a password reset email containing a magic link.
        Should raise an exception on failure.
        """

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
        """
        Send a notification email to the support team about a new ticket.
        """


__all__ = ["EmailSender"]
