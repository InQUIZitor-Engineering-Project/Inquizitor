from __future__ import annotations

import uuid
from pathlib import Path

from app.domain.services import FileStorage


class LocalFileStorage(FileStorage):
    def __init__(self, base_dir: Path | str = "uploads") -> None:
        self._base_dir = Path(base_dir)
        self._base_dir.mkdir(parents=True, exist_ok=True)

    def save(self, *, owner_id: int, filename: str, content: bytes) -> str:
        extension = Path(filename).suffix.lower()
        unique_name = f"{uuid.uuid4().hex}{extension}"
        stored_path = self._base_dir / unique_name
        stored_path.parent.mkdir(parents=True, exist_ok=True)
        stored_path.write_bytes(content)
        return str(stored_path)

    def delete(self, *, stored_path: str) -> None:
        path = Path(stored_path)
        if not path.is_absolute():
            path = Path.cwd() / path
        path.unlink(missing_ok=True)

    def get_url(self, *, stored_path: str) -> str:
        return stored_path


__all__ = ["LocalFileStorage"]
