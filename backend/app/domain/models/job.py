from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from .enums import JobStatus, JobType


@dataclass(slots=True)
class Job:
    id: int | None
    owner_id: int
    job_type: JobType
    status: JobStatus
    payload: dict[str, Any] = field(default_factory=dict)
    result: dict[str, Any] | None = None
    error: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


__all__ = ["Job"]
