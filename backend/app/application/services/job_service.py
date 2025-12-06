from __future__ import annotations

from datetime import datetime
from typing import Any, Callable, Dict, Optional

from app.application.interfaces import UnitOfWork
from app.domain.models import Job
from app.domain.models.enums import JobStatus, JobType


class JobService:
    def __init__(self, uow_factory: Callable[[], UnitOfWork]) -> None:
        self._uow_factory = uow_factory

    def create_job(self, *, owner_id: int, job_type: JobType, payload: Dict[str, Any]) -> Job:
        job = Job(
            id=None,
            owner_id=owner_id,
            job_type=job_type,
            status=JobStatus.PENDING,
            payload=payload,
            result=None,
            error=None,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        with self._uow_factory() as uow:
            return uow.jobs.add(job)

    def get_job(self, *, owner_id: int, job_id: int) -> Job:
        with self._uow_factory() as uow:
            job = uow.jobs.get(job_id)
            if not job or job.owner_id != owner_id:
                raise ValueError("Job not found")
            return job

    def list_jobs(self, *, owner_id: int):
        with self._uow_factory() as uow:
            jobs = uow.jobs.list_for_user(owner_id)
        return jobs

    def update_job_status(
        self,
        *,
        job_id: int,
        status: JobStatus,
        result: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
    ) -> Job:
        with self._uow_factory() as uow:
            job = uow.jobs.get(job_id)
            if not job:
                raise ValueError("Job not found")
            job.status = status
            job.result = result
            job.error = error
            job.updated_at = datetime.utcnow()
            return uow.jobs.update(job)


__all__ = ["JobService"]
