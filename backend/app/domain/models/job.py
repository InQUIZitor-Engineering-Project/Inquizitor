from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, Optional

from .enums import JobStatus, JobType


@dataclass(slots=True)
class Job:
    id: Optional[int]
    owner_id: int
    job_type: JobType
    status: JobStatus
    payload: Dict[str, Any] = field(default_factory=dict)
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


__all__ = ["Job"]
