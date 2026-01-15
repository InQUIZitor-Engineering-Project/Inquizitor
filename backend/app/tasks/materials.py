from __future__ import annotations

import logging
import time
from typing import Any

from app.celery_app import celery_app
from app.domain.models.enums import JobStatus
from app.infrastructure.monitoring.posthog_client import analytics

logger = logging.getLogger(__name__)


def _get_services() -> tuple[Any, Any]:
    # Lazy import to avoid circular imports during app startup
    from app.bootstrap import get_container

    container = get_container()
    return (
        container.provide_material_service(),
        container.provide_job_service(),
    )


@celery_app.task(name="app.tasks.process_material", bind=True)
def process_material_task(
    self: Any, job_id: int, owner_id: int, material_id: int
) -> int:
    _ = self
    start_time = time.time()
    material_service, job_service = _get_services()

    try:
        job_service.update_job_status(job_id=job_id, status=JobStatus.RUNNING)
    except Exception as exc:
        logger.exception("Failed to mark job %s as running: %s", job_id, exc)

    try:
        material = material_service.process_material(
            owner_id=owner_id, material_id=material_id
        )
        status_value = (material.processing_status or "").lower()
        if status_value != JobStatus.DONE.value:
            error_msg = material.processing_error or "Could not extract text"
            job_service.update_job_status(
                job_id=job_id,
                status=JobStatus.FAILED,
                error=error_msg,
                result={
                    "material_id": material.id,
                    "processing_status": material.processing_status,
                    "processing_error": error_msg,
                    "filename": material.filename,
                },
            )
            raise ValueError(error_msg)

        job_service.update_job_status(
            job_id=job_id,
            status=JobStatus.DONE,
            result={
                "material_id": material.id,
                "processing_status": material.processing_status,
                "extracted_text": material.extracted_text,
                "filename": material.filename,
            },
        )
        
        duration_sec = time.time() - start_time
        analytics.capture(
            user_id=owner_id,
            event="material_processing_completed",
            properties={
                "material_id": material.id,
                "job_id": job_id,
                "duration_total_sec": duration_sec,
                "duration_ocr_sec": material.duration_ocr_sec,
                "cache_hit": material.cache_hit,
                "status": "success",
                "mime_type": material.mime_type,
                "size_mb": (
                    round(material.size_bytes / (1024 * 1024), 2)
                    if material.size_bytes
                    else 0
                ),
                "page_count": material.page_count,
                "char_count": len(material.extracted_text)
                if material.extracted_text
                else 0,
            }
        )

        analytics.flush()

        return material.id
    except Exception as exc:
        logger.exception("Material processing job %s failed: %s", job_id, exc)
        job_service.update_job_status(
            job_id=job_id,
            status=JobStatus.FAILED,
            error=str(exc),
        )
        raise
