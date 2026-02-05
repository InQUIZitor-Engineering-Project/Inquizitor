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
    analysis_status: str | None = None
    routing_tier: str | None = None
    analysis_version: str | None = None
    created_at: datetime
    extracted_text: str | None = None
    markdown_twin: str | None = None
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


class MaterialUploadBatchResponse(BaseModel):
    materials: list[MaterialOut]


class MaterialAnalyzeRequest(BaseModel):
    material_ids: list[int]


class MaterialDeepAnalyzeRequest(BaseModel):
    material_ids: list[int]


class MaterialAnalyzeJob(BaseModel):
    job_id: int
    status: str
    material: MaterialOut


class MaterialAnalyzeResponse(BaseModel):
    jobs: list[MaterialAnalyzeJob]
    total_pages: int


class MaterialDeepAnalyzeResponse(BaseModel):
    jobs: list[MaterialAnalyzeJob]
    total_pages: int


__all__ = [
    "MaterialAnalyzeJob",
    "MaterialAnalyzeRequest",
    "MaterialAnalyzeResponse",
    "MaterialDeepAnalyzeRequest",
    "MaterialDeepAnalyzeResponse",
    "MaterialOut",
    "MaterialUpdate",
    "MaterialUploadBatchResponse",
    "MaterialUploadEnqueueResponse",
]