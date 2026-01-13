from __future__ import annotations

from posthog import Posthog

from app.core.config import get_settings


class AnalyticsClient:
    def __init__(self):
        self._client: Posthog | None = None

    @property
    def client(self) -> Posthog:
        if self._client is None:
            settings = get_settings()
            api_key = settings.POSTHOG_API_KEY or ""
            self._client = Posthog(
                project_api_key=api_key,
                host=settings.POSTHOG_HOST
            )
        return self._client

    def capture(self, user_id: str | int, event: str, properties: dict | None = None):
        """
        Capture an event in PostHog.
        user_id can be a string (email) or an integer (database ID).
        """
        settings = get_settings()
        if not settings.POSTHOG_API_KEY:
            return

        self.client.capture(
            distinct_id=str(user_id),
            event=event,
            properties=properties or {}
        )

    def flush(self):
        """Force immediate sending of all queued events."""
        if self._client:
            self._client.flush()

    def shutdown(self):
        if self._client:
            self._client.flush()
            self._client.shutdown()

analytics = AnalyticsClient()

