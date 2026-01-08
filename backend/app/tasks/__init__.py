"""
Celery tasks package.
"""

from app.celery_app import celery_app

# Ensure task modules are imported so Celery registers them
from app.tasks import (
    email,  # noqa: F401
    materials,  # noqa: F401
    tests,  # noqa: F401
)

__all__ = ["celery_app"]
