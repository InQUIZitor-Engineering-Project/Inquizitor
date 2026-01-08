from __future__ import annotations

from contextlib import AbstractContextManager
from pathlib import Path
from typing import Protocol


class FileStorage(Protocol):
    def save(self, *, owner_id: int, filename: str, content: bytes) -> str:
        """Persist the file and return the storage path."""

        ...

    def delete(self, *, stored_path: str) -> None:
        ...

    def get_url(self, *, stored_path: str) -> str:
        ...

    def download_to_temp(self, *, stored_path: str) -> AbstractContextManager[Path]:
        """Provide a local path to the stored object for temporary processing."""
        ...


__all__ = ["FileStorage"]

