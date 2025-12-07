from __future__ import annotations

from typing import Protocol, ContextManager
from pathlib import Path


class FileStorage(Protocol):
    def save(self, *, owner_id: int, filename: str, content: bytes) -> str:
        """Persist the file and return the storage path."""

        ...

    def delete(self, *, stored_path: str) -> None:
        ...

    def get_url(self, *, stored_path: str) -> str:
        ...

    def download_to_temp(self, *, stored_path: str) -> ContextManager[Path]:
        """Provide a local path to the stored object for temporary processing."""
        ...


__all__ = ["FileStorage"]

