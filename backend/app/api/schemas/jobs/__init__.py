from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class JobOut(BaseModel):
    id: int
    owner_id: int
    job_type: str
    status: str
    payload: dict[str, Any]
    result: dict[str, Any] | None = None
    error: str | None = None
    created_at: datetime
    updated_at: datetime


class JobEnqueueResponse(BaseModel):
    job_id: int
    status: str


__all__ = ["JobEnqueueResponse", "JobOut"]
