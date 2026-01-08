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


__all__ = ["EmailSender"]
