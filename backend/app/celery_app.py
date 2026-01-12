from __future__ import annotations

from celery import Celery

from app.core.config import get_settings
from app.core.monitoring import init_sentry

init_sentry()

settings = get_settings()

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
