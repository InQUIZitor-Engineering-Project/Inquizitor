from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel


class JobOut(BaseModel):
    id: int
    owner_id: int
    job_type: str
    status: str
    payload: Dict[str, Any]
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class JobEnqueueResponse(BaseModel):
    job_id: int
    status: str


__all__ = ["JobOut", "JobEnqueueResponse"]
