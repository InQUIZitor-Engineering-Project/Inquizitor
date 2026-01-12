from __future__ import annotations

import httpx

from app.core.config import get_settings


class TurnstileService:
    """Service for verifying Cloudflare Turnstile tokens."""

    def __init__(self, secret_key: str | None = None) -> None:
        self._secret_key = secret_key or get_settings().TURNSTILE_SECRET_KEY
        self._verify_url = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

    async def verify_token(
        self, token: str | None, client_ip: str | None = None
    ) -> bool:
        """
        Verify a Turnstile token with Cloudflare.

        Args:
            token: The Turnstile response token from the frontend
            client_ip: Optional client IP address for additional validation

        Returns:
            True if token is valid, False otherwise
        """
        # If secret key is not set, we assume Turnstile is disabled (e.g. in dev)
        if not self._secret_key:
            return True

        if not token or not token.strip():
            return False

        payload = {
            "secret": self._secret_key,
            "response": token.strip(),
        }

        if client_ip:
            payload["remoteip"] = client_ip

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self._verify_url,
                    data=payload,
                    timeout=10.0
                )
                response.raise_for_status()

                data = response.json()
                return data.get("success", False)

            except httpx.RequestError:
                # Network error - fail closed for security
                return False
            except Exception:
                # Any other error - fail closed
                return False


__all__ = ["TurnstileService"]
