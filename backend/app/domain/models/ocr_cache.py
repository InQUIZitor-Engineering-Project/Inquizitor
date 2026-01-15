from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(slots=True)
class OcrCache:
    id: int | None
    user_id: int
    file_hash: str
    ocr_options_hash: str
    pipeline_version: str
    result_ref: str
    cache_key: str
    created_at: datetime | None = None

    def __post_init__(self) -> None:
        self.file_hash = self.file_hash.strip()
        self.ocr_options_hash = self.ocr_options_hash.strip()
        self.pipeline_version = self.pipeline_version.strip()
        self.result_ref = self.result_ref.strip()
        self.cache_key = self.cache_key.strip()
        if not self.file_hash:
            raise ValueError("file_hash cannot be empty")
        if not self.ocr_options_hash:
            raise ValueError("ocr_options_hash cannot be empty")
        if not self.pipeline_version:
            raise ValueError("pipeline_version cannot be empty")
        if not self.result_ref:
            raise ValueError("result_ref cannot be empty")
        if not self.cache_key:
            raise ValueError("cache_key cannot be empty")


__all__ = ["OcrCache"]

