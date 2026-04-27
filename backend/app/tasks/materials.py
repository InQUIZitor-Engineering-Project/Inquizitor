from __future__ import annotations

import logging
import time
from typing import Any

from app.api.schemas.materials import MaterialUpdate
from app.celery_app import celery_app
from app.domain.models.enums import JobStatus
from app.infrastructure.monitoring.posthog_client import analytics

logger = logging.getLogger(__name__)


def _get_services() -> tuple[Any, Any, Any]:
    # Lazy import to avoid circular imports during app startup
    from app.bootstrap import get_container

    container = get_container()
    return (
        container.provide_material_service(),
        container.provide_material_analysis_service(),
        container.provide_job_service(),
    )


@celery_app.task(name="app.tasks.process_material", bind=True)
def process_material_task(
    self: Any, job_id: int, owner_id: int, material_id: int
) -> int:
    _ = self
    start_time = time.time()
    material_service, _, job_service = _get_services()

    try:
        job_service.update_job_status(job_id=job_id, status=JobStatus.RUNNING)
    except Exception as exc:
        logger.exception("Failed to mark job %s as running: %s", job_id, exc)

    try:
        material = material_service.process_material(
            owner_id=owner_id, material_id=material_id
        )
        # MaterialOut has processing_status as string; DTO maps domain status.
        status_value = (
            material.processing_status.lower()
            if material.processing_status
            else ""
        )
        analysis_status_value = (material.analysis_status or "").lower()
        # Thumbnail = partially successful; markdown_twin = Gemini succeeded.
        has_thumbnail = bool(material.thumbnail_path)
        has_markdown_twin = bool(material.markdown_twin)
        analysis_succeeded = analysis_status_value == JobStatus.DONE.value
        
        if status_value != JobStatus.DONE.value:
            error_msg = material.processing_error or "Could not extract text"
            
            # If thumbnail was generated OR Gemini analysis succeeded, mark job as done
            # (material is usable for viewing even without text extraction)
            # Also update material status to DONE if it has thumbnail or markdown_twin
            if has_thumbnail or analysis_succeeded:
                # Update material status to DONE since it has thumbnail or markdown_twin
                # (it's usable even without text extraction)
                try:
                    material_service.update_material(
                        owner_id=owner_id,
                        material_id=material.id,
                        payload=MaterialUpdate(processing_status="done"),
                    )
                    # Refresh material to get updated status
                    material = material_service.get_material(
                        owner_id=owner_id, material_id=material.id
                    )
                except ValueError:
                    logger.warning(
                        "Material %s not found when updating status "
                        "— likely deleted during processing",
                        material.id,
                    )
                    return material.id
                
                job_service.update_job_status(
                    job_id=job_id,
                    status=JobStatus.DONE,
                    error=None,  # No error, just a warning
                    result={
                        "material_id": material.id,
                        "processing_status": "done",
                        "processing_warning": (
                            error_msg if not analysis_succeeded else None
                        ),
                        "filename": material.filename,
                        "has_thumbnail": has_thumbnail,
                        "has_markdown_twin": has_markdown_twin,
                    },
                )
                # Don't raise error - material is usable with thumbnail or markdown_twin
            else:
                # No thumbnail and no text - complete failure
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


@celery_app.task(name="app.tasks.analyze_material", bind=True)
def analyze_material_task(
    self: Any, job_id: int, owner_id: int, material_id: int
) -> int:
    _ = self
    start_time = time.time()
    _, analysis_service, job_service = _get_services()

    try:
        job_service.update_job_status(job_id=job_id, status=JobStatus.RUNNING)
    except Exception as exc:
        logger.exception("Failed to mark job %s as running: %s", job_id, exc)

    try:
        material = analysis_service.analyze_material(
            owner_id=owner_id, material_id=material_id
        )
        status_value = (material.analysis_status or "").lower()
        if status_value != JobStatus.DONE.value:
            error_msg = material.processing_error or "Could not analyze material"
            job_service.update_job_status(
                job_id=job_id,
                status=JobStatus.FAILED,
                error=error_msg,
                result={
                    "material_id": material.id,
                    "analysis_status": material.analysis_status,
                    "analysis_error": error_msg,
                    "filename": material.filename,
                },
            )
            raise ValueError(error_msg)

        job_service.update_job_status(
            job_id=job_id,
            status=JobStatus.DONE,
            result={
                "material_id": material.id,
                "analysis_status": material.analysis_status,
                "routing_tier": material.routing_tier,
                "analysis_version": material.analysis_version,
                "markdown_twin": material.markdown_twin,
                "filename": material.filename,
            },
        )

        duration_sec = time.time() - start_time
        analytics.capture(
            user_id=owner_id,
            event="material_analysis_completed",
            properties={
                "material_id": material.id,
                "job_id": job_id,
                "duration_total_sec": duration_sec,
                "status": "success",
                "routing_tier": material.routing_tier,
                "analysis_version": material.analysis_version,
                "mime_type": material.mime_type,
                "size_mb": (
                    round(material.size_bytes / (1024 * 1024), 2)
                    if material.size_bytes
                    else 0
                ),
                "page_count": material.page_count,
            },
        )

        analytics.flush()
        return material.id
    except Exception as exc:
        logger.exception("Material analysis job %s failed: %s", job_id, exc)
        job_service.update_job_status(
            job_id=job_id,
            status=JobStatus.FAILED,
            error=str(exc),
        )
        raise


@celery_app.task(name="app.tasks.cleanup_user_files")
def cleanup_user_files_task(file_paths: list[str]) -> None:
    """Background task to delete physical files from storage."""
    from app.bootstrap import get_container

    container = get_container()
    storage = container.provide_file_storage()

    for path in file_paths:
        try:
            storage.delete(stored_path=path)
            logger.info("Successfully deleted physical file: %s", path)
        except Exception as exc:
            logger.error("Failed to delete physical file %s: %s", path, exc)
