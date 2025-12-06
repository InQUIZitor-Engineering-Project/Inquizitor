from __future__ import annotations

import logging

from pathlib import Path

from app.api.schemas.tests import TestGenerateRequest, PdfExportConfig
from app.celery_app import celery_app
from app.domain.models.enums import JobStatus

logger = logging.getLogger(__name__)


def _get_services():
    # Lazy import to avoid circular imports during app startup
    from app.bootstrap import get_container

    container = get_container()
    return (
        container.provide_test_service(),
        container.provide_job_service(),
        container.provide_export_storage(),
    )


@celery_app.task(name="app.tasks.generate_test", bind=True)
def generate_test_task(self, job_id: int, owner_id: int, request_payload: dict):
    test_service, job_service, _ = _get_services()

    try:
        job_service.update_job_status(job_id=job_id, status=JobStatus.RUNNING)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to mark job %s as running: %s", job_id, exc)

    try:
        request = TestGenerateRequest(**request_payload)
        response = test_service.generate_test_from_input(request=request, owner_id=owner_id)
        job_service.update_job_status(
            job_id=job_id,
            status=JobStatus.DONE,
            result={"test_id": response.test_id, "num_questions": response.num_questions},
        )
        return response.test_id
    except Exception as exc:  # noqa: BLE001
        logger.exception("Job %s failed: %s", job_id, exc)
        job_service.update_job_status(
            job_id=job_id,
            status=JobStatus.FAILED,
            error=str(exc),
        )
        raise


@celery_app.task(name="app.tasks.export_test_pdf", bind=True)
def export_test_pdf_task(self, job_id: int, owner_id: int, test_id: int, show_answers: bool = False):
    test_service, job_service, export_storage = _get_services()

    try:
        job_service.update_job_status(job_id=job_id, status=JobStatus.RUNNING)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to mark job %s as running: %s", job_id, exc)

    try:
        pdf_bytes, filename = test_service.export_test_pdf(
            owner_id=owner_id, test_id=test_id, show_answers=show_answers
        )
        stored_path = export_storage.save(
            owner_id=owner_id,
            filename=filename,
            content=pdf_bytes,
        )
        rel_path = Path(stored_path)
        try:
            rel_path = rel_path.relative_to(export_storage._base_dir)  # type: ignore[attr-defined]
        except Exception:
            pass
        file_url = f"/files/exports/{rel_path}".replace("//", "/")
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
        return stored_path
    except Exception as exc:  # noqa: BLE001
        logger.exception("PDF export job %s failed: %s", job_id, exc)
        job_service.update_job_status(
            job_id=job_id,
            status=JobStatus.FAILED,
            error=str(exc),
        )
        raise


@celery_app.task(name="app.tasks.export_custom_test_pdf", bind=True)
def export_custom_test_pdf_task(self, job_id: int, owner_id: int, test_id: int, config_payload: dict):
    test_service, job_service, export_storage = _get_services()

    try:
        job_service.update_job_status(job_id=job_id, status=JobStatus.RUNNING)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to mark job %s as running: %s", job_id, exc)

    try:
        config = PdfExportConfig(**config_payload)
        pdf_bytes, filename = test_service.export_custom_test_pdf(
            owner_id=owner_id,
            test_id=test_id,
            config=config,
        )
        stored_path = export_storage.save(
            owner_id=owner_id,
            filename=filename,
            content=pdf_bytes,
        )
        rel_path = Path(stored_path)
        try:
            rel_path = rel_path.relative_to(export_storage._base_dir)  # type: ignore[attr-defined]
        except Exception:
            pass
        file_url = f"/files/exports/{rel_path}".replace("//", "/")
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
        return stored_path
    except Exception as exc:  # noqa: BLE001
        logger.exception("Custom PDF export job %s failed: %s", job_id, exc)
        job_service.update_job_status(
            job_id=job_id,
            status=JobStatus.FAILED,
            error=str(exc),
        )
        raise
