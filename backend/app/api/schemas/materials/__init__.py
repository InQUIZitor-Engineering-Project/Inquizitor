# app/schemas/material.py
from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

class MaterialOut(BaseModel):
    id: int
    file_id: int
    filename: str
    mime_type: Optional[str] = None
    size_bytes: Optional[int] = None
    checksum: Optional[str] = None
    processing_status: str
    created_at: datetime
    extracted_text: Optional[str] = None
    processing_error: Optional[str] = None

    class Config:
        from_attributes = True

class MaterialUpdate(BaseModel):
    extracted_text: Optional[str] = None
    processing_status: Optional[Literal["pending", "done", "failed"]] = None


__all__ = [
    "MaterialOut",
    "MaterialUpdate",
]