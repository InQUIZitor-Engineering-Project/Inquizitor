from __future__ import annotations

import logging
from typing import Any

from app.api.schemas.tests import (
    BulkConvertQuestionsRequest,
    BulkRegenerateQuestionsRequest,
    PdfExportConfig,
    TestGenerateRequest,
)
from app.celery_app import celery_app
from app.domain.models.enums import JobStatus
from app.infrastructure.monitoring.posthog_client import analytics

logger = logging.getLogger(__name__)


def _get_services() -> tuple[Any, Any, Any]:
    # Lazy import to avoid circular imports during app startup
    from app.bootstrap import get_container

    container = get_container()
    return (
        container.provide_test_service(),
        container.provide_job_service(),
        container.provide_export_storage(),
    )


@celery_app.task(name="app.tasks.generate_test", bind=True)
def generate_test_task(
    self: Any, job_id: int, owner_id: int, request_payload: dict[str, Any]
) -> int:
    _ = self
    test_service, job_service, _ = _get_services()

    try:
        job_service.update_job_status(job_id=job_id, status=JobStatus.RUNNING)
    except Exception as exc:
        logger.exception("Failed to mark job %s as running: %s", job_id, exc)

    try:
        request = TestGenerateRequest(**request_payload)
        response = test_service.generate_test_from_input(
            request=request, owner_id=owner_id
        )
        job_service.update_job_status(
            job_id=job_id,
            status=JobStatus.DONE,
            result={
                "test_id": response.test_id,
                "num_questions": response.num_questions,
            },
        )
        analytics.flush()
        return response.test_id
    except Exception as exc:
        logger.exception("Job %s failed: %s", job_id, exc)
        job_service.update_job_status(
            job_id=job_id,
            status=JobStatus.FAILED,
            error=str(exc),
        )
        raise


@celery_app.task(name="app.tasks.export_test_pdf", bind=True)
def export_test_pdf_task(
    self: Any, job_id: int, owner_id: int, test_id: int, show_answers: bool = False
) -> str:
    _ = self
    test_service, job_service, export_storage = _get_services()

    try:
        job_service.update_job_status(job_id=job_id, status=JobStatus.RUNNING)
    except Exception as exc:
        logger.exception("Failed to mark job %s as running: %s", job_id, exc)

    try:
        (
            pdf_bytes,
            filename,
            cache_key,
            config_hash,
            template_version,
            cached_path,
        ) = test_service.export_test_pdf(
            owner_id=owner_id, test_id=test_id, show_answers=show_answers
        )
        if cached_path:
            stored_path = cached_path
        else:
            stored_path = export_storage.save(
                owner_id=owner_id,
                filename=filename,
                content=pdf_bytes or b"",
            )
            test_service.record_pdf_export_cache(
                test_id=test_id,
                cache_key=cache_key,
                config_hash=config_hash,
                template_version=template_version,
                stored_path=stored_path,
            )
        file_url = export_storage.get_url(stored_path=stored_path)
        job_service.update_job_status(
            job_id=job_id,
            status=JobStatus.DONE,
            result={
                "file_path": stored_path,
                "file_url": file_url,
                "filename": filename,
                "test_id": test_id,
            },
        )
        analytics.flush()
        return stored_path
    except Exception as exc:
        logger.exception("PDF export job %s failed: %s", job_id, exc)
        job_service.update_job_status(
            job_id=job_id,
            status=JobStatus.FAILED,
            error=str(exc),
        )
        raise


@celery_app.task(name="app.tasks.export_custom_test_pdf", bind=True)
def export_custom_test_pdf_task(
    self: Any, job_id: int, owner_id: int, test_id: int, config_payload: dict[str, Any]
) -> str:
    _ = self
    test_service, job_service, export_storage = _get_services()

    try:
        job_service.update_job_status(job_id=job_id, status=JobStatus.RUNNING)
    except Exception as exc:
        logger.exception("Failed to mark job %s as running: %s", job_id, exc)

    try:
        config = PdfExportConfig(**config_payload)
        (
            pdf_bytes,
            filename,
            cache_key,
            config_hash,
            template_version,
            cached_path,
        ) = test_service.export_custom_test_pdf(
            owner_id=owner_id,
            test_id=test_id,
            config=config,
        )
        if cached_path:
            stored_path = cached_path
        else:
            stored_path = export_storage.save(
                owner_id=owner_id,
                filename=filename,
                content=pdf_bytes or b"",
            )
            test_service.record_pdf_export_cache(
                test_id=test_id,
                cache_key=cache_key,
                config_hash=config_hash,
                template_version=template_version,
                stored_path=stored_path,
            )
        file_url = export_storage.get_url(stored_path=stored_path)
        job_service.update_job_status(
            job_id=job_id,
            status=JobStatus.DONE,
            result={
                "file_path": stored_path,
                "file_url": file_url,
                "filename": filename,
                "test_id": test_id,
            },
        )
        analytics.flush()
        return stored_path
    except Exception as exc:
        logger.exception("Custom PDF export job %s failed: %s", job_id, exc)
        job_service.update_job_status(
            job_id=job_id,
            status=JobStatus.FAILED,
            error=str(exc),
        )
        raise


@celery_app.task(name="app.tasks.bulk_regenerate_questions", bind=True)
def bulk_regenerate_questions_task(
    self: Any, job_id: int, owner_id: int, test_id: int, payload_dict: dict[str, Any]
) -> int:
    _ = self
    test_service, job_service, _ = _get_services()

    try:
        job_service.update_job_status(job_id=job_id, status=JobStatus.RUNNING)
    except Exception as exc:
        logger.exception("Failed to mark job %s as running: %s", job_id, exc)

    try:
        payload = BulkRegenerateQuestionsRequest(**payload_dict)
        num_regenerated = test_service.bulk_regenerate_questions(
            owner_id=owner_id,
            test_id=test_id,
            payload=payload,
        )
        job_service.update_job_status(
            job_id=job_id,
            status=JobStatus.DONE,
            result={"num_regenerated": num_regenerated, "test_id": test_id},
        )
        analytics.flush()
        return num_regenerated
    except Exception as exc:
        logger.exception("Bulk regeneration job %s failed: %s", job_id, exc)
        job_service.update_job_status(
            job_id=job_id,
            status=JobStatus.FAILED,
            error=str(exc),
        )
        raise


@celery_app.task(name="app.tasks.bulk_convert_questions", bind=True)
def bulk_convert_questions_task(
    self: Any, job_id: int, owner_id: int, test_id: int, payload_dict: dict[str, Any]
) -> int:
    _ = self
    test_service, job_service, _ = _get_services()

    try:
        job_service.update_job_status(job_id=job_id, status=JobStatus.RUNNING)
    except Exception as exc:
        logger.exception("Failed to mark job %s as running: %s", job_id, exc)

    try:
        payload = BulkConvertQuestionsRequest(**payload_dict)
        num_converted = test_service.bulk_convert_questions(
            owner_id=owner_id,
            test_id=test_id,
            payload=payload,
        )
        job_service.update_job_status(
            job_id=job_id,
            status=JobStatus.DONE,
            result={"num_converted": num_converted, "test_id": test_id},
        )
        analytics.flush()
        return num_converted
    except Exception as exc:
        logger.exception("Bulk conversion job %s failed: %s", job_id, exc)
        job_service.update_job_status(
            job_id=job_id,
            status=JobStatus.FAILED,
            error=str(exc),
        )
        raise
