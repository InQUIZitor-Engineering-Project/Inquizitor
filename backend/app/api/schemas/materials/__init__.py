# app/schemas/material.py
from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class MaterialOut(BaseModel):
    id: int
    file_id: int
    filename: str
    mime_type: str | None = None
    size_bytes: int | None = None
    page_count: int | None = None
    checksum: str | None = None
    processing_status: str
    created_at: datetime
    extracted_text: str | None = None
    processing_error: str | None = None
    cache_hit: bool | None = None
    duration_ocr_sec: float | None = None

    class Config:
        from_attributes = True

class MaterialUpdate(BaseModel):
    extracted_text: str | None = None
    processing_status: Literal["pending", "done", "failed"] | None = None


class MaterialUploadEnqueueResponse(BaseModel):
    job_id: int
    status: str
    material: MaterialOut


__all__ = [
    "MaterialOut",
    "MaterialUpdate",
    "MaterialUploadEnqueueResponse",
]