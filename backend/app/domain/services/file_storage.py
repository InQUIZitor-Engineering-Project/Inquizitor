from __future__ import annotations

from typing import Protocol


class FileStorage(Protocol):
    def save(self, *, owner_id: int, filename: str, content: bytes) -> str:
        """Persist the file and return the storage path."""

        ...

    def delete(self, *, stored_path: str) -> None:
        ...

    def get_url(self, *, stored_path: str) -> str:
        ...


__all__ = ["FileStorage"]

