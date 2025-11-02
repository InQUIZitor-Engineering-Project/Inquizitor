from __future__ import annotations

import pytesseract
from PIL import Image

from app.domain.services import OCRService


class DefaultOCRService(OCRService):
    def __init__(self, language: str = "pol") -> None:
        self._language = language

    def extract_text(self, *, file_path: str) -> str:
        try:
            with Image.open(file_path) as image:
                return pytesseract.image_to_string(image, lang=self._language)
        except Exception:  # noqa: BLE001
            return ""
