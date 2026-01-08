from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_job_service
from app.api.schemas.jobs import JobOut
from app.application import dto
from app.application.services import JobService
from app.core.security import get_current_user
from app.db.models import User

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/{job_id}", response_model=JobOut)
def get_job(
    job_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    job_service: Annotated[JobService, Depends(get_job_service)],
) -> JobOut:
    if current_user.id is None:
        raise HTTPException(
            status_code=401, detail="User ID is missing"
        )
    try:
        job = job_service.get_job(owner_id=current_user.id, job_id=job_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return dto.to_job_out(job)


@router.get("", response_model=list[JobOut])
def list_jobs(
    current_user: Annotated[User, Depends(get_current_user)],
    job_service: Annotated[JobService, Depends(get_job_service)],
) -> list[JobOut]:
    if current_user.id is None:
        raise HTTPException(
            status_code=401, detail="User ID is missing"
        )
    jobs = job_service.list_jobs(owner_id=current_user.id)
    return [dto.to_job_out(job) for job in jobs]


__all__ = ["router"]
