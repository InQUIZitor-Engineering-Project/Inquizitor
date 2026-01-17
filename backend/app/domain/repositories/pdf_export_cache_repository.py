from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime

from app.domain.models import PdfExportCache


class PdfExportCacheRepository(ABC):
    @abstractmethod
    def add(self, entry: PdfExportCache) -> PdfExportCache:
        raise NotImplementedError

    @abstractmethod
    def get_by_key(self, cache_key: str) -> PdfExportCache | None:
        raise NotImplementedError

    @abstractmethod
    def remove(self, entry_id: int) -> None:
        raise NotImplementedError

    @abstractmethod
    def remove_for_test(self, test_id: int) -> None:
        raise NotImplementedError

    def purge_older_than(self, cutoff: datetime) -> int:
        _ = cutoff
        return 0


__all__ = ["PdfExportCacheRepository"]

