from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime

from app.domain.models import OcrCache


class OcrCacheRepository(ABC):
    @abstractmethod
    def add(self, entry: OcrCache) -> OcrCache:
        raise NotImplementedError

    @abstractmethod
    def get_by_key(self, cache_key: str) -> OcrCache | None:
        raise NotImplementedError

    @abstractmethod
    def remove(self, entry_id: int) -> None:
        raise NotImplementedError

    def purge_older_than(self, cutoff: datetime) -> int:
        _ = cutoff
        return 0


__all__ = ["OcrCacheRepository"]

