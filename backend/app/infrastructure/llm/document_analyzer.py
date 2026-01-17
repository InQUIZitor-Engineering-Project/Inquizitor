from __future__ import annotations

import logging
import mimetypes
from functools import lru_cache
from pathlib import Path
from typing import Any

from google import genai
from google.genai import types
from pydantic import BaseModel

from app.core.config import get_settings
from app.domain.models.enums import RoutingTier
from app.domain.services import DocumentAnalyzer

from .prompts import PromptBuilder

logger = logging.getLogger(__name__)

class AnalysisPayload(BaseModel):
    """Schemat danych wyjściowych z modelu Gemini."""
    routing_tier: str
    markdown_twin: str
    suggested_title: str | None = None

    def to_tier(self) -> RoutingTier:
        value = (self.routing_tier or "").strip().lower()
        if "fast" in value:
            return RoutingTier.FAST
        if "reasoning" in value or "slow" in value:
            return RoutingTier.REASONING
        return RoutingTier.FAST

class GeminiDocumentAnalyzer(DocumentAnalyzer):
    def __init__(self, model_name: str | None = None) -> None:
        settings = get_settings()
        self._model_name = model_name or settings.GEMINI_ANALYSIS_MODEL

    @staticmethod
    @lru_cache
    def _client() -> genai.Client:
        settings = get_settings()
        return genai.Client(api_key=settings.GEMINI_API_KEY)

    def analyze(
        self,
        *,
        source_text: str,
        filename: str | None,
        mime_type: str | None,
        file_path: str | None = None,
    ) -> tuple[str, RoutingTier, dict, str | None]:
        # If we have a file, we don't need to send the full source_text in the prompt
        # Gemini will extract it better from the file itself.
        # We only send a small snippet if available as a hint.
        hint_text = source_text[:1000] if source_text else ""
        
        prompt = PromptBuilder.build_document_analysis_prompt(
            text=hint_text, filename=filename, mime_type=mime_type
        )

        # Używamy klasy Pydantic jako schematu
        generation_config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=AnalysisPayload,
            temperature=0.1,
        )

        contents: list[Any] = []
        
        if file_path:
            local_path = Path(file_path)
            if not local_path.exists():
                raise ValueError(f"Nie znaleziono pliku: {file_path}")

            try:
                if not mime_type:
                    mime_type, _ = mimetypes.guess_type(local_path)
                if not mime_type:
                    mime_type = "application/octet-stream"

                logger.info(
                    "Wysyłanie pliku %s z typem MIME: %s", local_path, mime_type
                )
                uploaded_file = self._client().files.upload(
                    file=local_path,
                    config=types.UploadFileConfig(
                        mime_type=mime_type,
                        display_name=filename or local_path.name,
                    ),
                )
                contents.append(uploaded_file)
            except Exception as exc:
                logger.exception("Błąd uploadu pliku do Gemini: %s", exc)
                raise ValueError(f"Błąd przesyłania pliku: {exc}") from exc

        contents.append(prompt)

        try:
            response = self._client().models.generate_content(
                model=self._model_name,
                contents=contents,
                config=generation_config,
            )
        except Exception as exc:
            self._handle_api_errors(exc)

        # Pobieranie sparsowanych danych (response_schema -> response.parsed)
        try:
            # Nowe SDK parsuje JSON do obiektu, jeśli podano response_schema
            parsed_data = response.parsed
            if not parsed_data:
                # Rezerwowe parsowanie ręczne
                parsed_data = AnalysisPayload.model_validate_json(response.text)
        except Exception as exc:
            logger.error("Błąd walidacji odpowiedzi: %s", response.text)
            raise ValueError(
                f"Model zwrócił nieprawidłowy format danych: {exc}"
            ) from exc

        usage = {}
        if response.usage_metadata:
            usage = {
                "prompt_tokens": response.usage_metadata.prompt_token_count,
                "candidates_tokens": response.usage_metadata.candidates_token_count,
                "total_tokens": response.usage_metadata.total_token_count,
            }

        return (
            parsed_data.markdown_twin.strip(),
            parsed_data.to_tier(),
            usage,
            parsed_data.suggested_title,
        )

    def _handle_api_errors(self, exc: Exception) -> None:
        msg = str(exc).upper()
        if any(err in msg for err in ["RESOURCE_EXHAUSTED", "429", "QUOTA"]):
            raise ValueError("Limit zapytań Gemini przekroczony. Spróbuj za chwilę.")
        raise RuntimeError(f"Błąd Gemini API: {exc}") from exc

__all__ = ["GeminiDocumentAnalyzer"]