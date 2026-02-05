from __future__ import annotations

from typing import Protocol

from app.domain.models.enums import RoutingTier
from app.domain.repositories import OcrCacheRepository


class DocumentAnalyzer(Protocol):
    def analyze(
        self,
        *,
        source_text: str,
        filename: str | None,
        mime_type: str | None,
        file_path: str | None = None,
        user_id: int | None = None,
        ocr_cache_repository: OcrCacheRepository | None = None,
    ) -> tuple[str, RoutingTier, dict, str | None]:
        ...


__all__ = ["DocumentAnalyzer"]

