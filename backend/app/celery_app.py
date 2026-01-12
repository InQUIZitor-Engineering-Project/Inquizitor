from __future__ import annotations

from celery import Celery

from app.core.config import get_settings

settings = get_settings()

if settings.SENTRY_DSN:
    import sentry_sdk

    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.SENTRY_ENV,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )

celery_app = Celery(
    "inquizitor",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_default_queue=settings.CELERY_TASK_DEFAULT_QUEUE,
    task_track_started=True,
    task_time_limit=60 * 6,  # hard limit
    task_soft_time_limit=60 * 4,  # graceful limit
    result_expires=3600,
)

# Autodiscover tasks under app.tasks.* (pass the app package, not app.tasks)
celery_app.autodiscover_tasks(["app"])

__all__ = ["celery_app"]
