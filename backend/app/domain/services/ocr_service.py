from __future__ import annotations

from typing import Protocol


class OCRService(Protocol):
    def extract_text(self, *, file_path: str) -> str:
        ...


__all__ = ["OCRService"]

