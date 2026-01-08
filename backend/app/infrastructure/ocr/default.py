from __future__ import annotations

from typing import cast

import pytesseract
from PIL import Image

from app.domain.services import OCRService


class DefaultOCRService(OCRService):
    def __init__(self, language: str = "pol+eng") -> None:
        self._language = language

    def extract_text(self, *, file_path: str) -> str:
        try:
            with Image.open(file_path) as image:
                return cast(
                    str, pytesseract.image_to_string(image, lang=self._language)
                )
        except Exception:
            return ""
