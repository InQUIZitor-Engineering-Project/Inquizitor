import logging

import sentry_sdk
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

from app.core.config import get_settings


def init_sentry() -> None:
    settings = get_settings()
    if not settings.SENTRY_DSN:
        return

    traces_sample_rate = 1.0
    profiles_sample_rate = 1.0

    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.SENTRY_ENV,
        integrations=[
            FastApiIntegration(),
            CeleryIntegration(monitor_beat_tasks=True),
            SqlalchemyIntegration(),
            RedisIntegration(),
            LoggingIntegration(
                level=logging.INFO,  # Logi INFO jako breadcrumbs (historia)
                event_level=logging.ERROR,  # Logi ERROR jako eventy w Sentry
            ),
        ],
        traces_sample_rate=traces_sample_rate,
        profiles_sample_rate=profiles_sample_rate,
        send_default_pii=False,  # Nie wysyłaj wrażliwych danych (np. haseł)
    )

