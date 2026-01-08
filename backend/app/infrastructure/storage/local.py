from __future__ import annotations

import uuid
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

from app.domain.services import FileStorage


class LocalFileStorage(FileStorage):
    def __init__(self, base_dir: Path | str = "uploads") -> None:
        self._base_dir = Path(base_dir)
        self._base_dir.mkdir(parents=True, exist_ok=True)

    def _resolve(self, stored_path: str) -> Path:
        path = Path(stored_path)
        if not path.is_absolute():
            path = self._base_dir / path
        return path

    def save(self, *, owner_id: int, filename: str, content: bytes) -> str:
        _ = owner_id
        extension = Path(filename).suffix.lower()
        unique_name = f"{uuid.uuid4().hex}{extension}"
        stored_path = self._base_dir / unique_name
        stored_path.parent.mkdir(parents=True, exist_ok=True)
        stored_path.write_bytes(content)
        return str(stored_path)

    def delete(self, *, stored_path: str) -> None:
        path = self._resolve(stored_path)
        path.unlink(missing_ok=True)

    def get_url(self, *, stored_path: str) -> str:
        path = self._resolve(stored_path)
        try:
            rel = path.relative_to(self._base_dir.resolve())
        except Exception:
            return str(path)
        # Special-case exports so they remain downloadable via the API route
        if "exports" in self._base_dir.name:
            return f"/files/exports/{rel}".replace("//", "/")
        return str(path)

    @contextmanager
    def download_to_temp(self, *, stored_path: str) -> Iterator[Path]:
        path = self._resolve(stored_path)
        yield path


__all__ = ["LocalFileStorage"]
