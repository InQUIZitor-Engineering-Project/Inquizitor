from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(slots=True)
class PdfExportCache:
    id: int | None
    test_id: int
    cache_key: str
    config_hash: str
    template_version: str
    stored_path: str
    created_at: datetime | None = None

    def __post_init__(self) -> None:
        self.cache_key = self.cache_key.strip()
        self.config_hash = self.config_hash.strip()
        self.template_version = self.template_version.strip()
        self.stored_path = self.stored_path.strip()
        if not self.cache_key:
            raise ValueError("cache_key cannot be empty")
        if not self.config_hash:
            raise ValueError("config_hash cannot be empty")
        if not self.template_version:
            raise ValueError("template_version cannot be empty")
        if not self.stored_path:
            raise ValueError("stored_path cannot be empty")


__all__ = ["PdfExportCache"]

