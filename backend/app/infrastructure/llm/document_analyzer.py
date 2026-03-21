from __future__ import annotations

import hashlib
import json
import logging
import mimetypes
from functools import lru_cache
from pathlib import Path
from typing import Any

from google import genai
from google.genai import types
from pydantic import BaseModel

from app.core.config import get_settings
from app.domain.models import OcrCache
from app.domain.models.enums import RoutingTier
from app.domain.repositories import OcrCacheRepository
from app.domain.services import DocumentAnalyzer
from app.infrastructure.cache.cache_utils import (
    OCR_PIPELINE_VERSION,
    hash_payload,
    normalize_config,
)

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
        user_id: int | None = None,
        ocr_cache_repository: OcrCacheRepository | None = None,
    ) -> tuple[str, RoutingTier, dict, str | None]:
        # Check cache if we have file_path, user_id and repository
        if file_path and user_id is not None and ocr_cache_repository:
            cached_result = self._check_cache(
                file_path=file_path,
                filename=filename,
                mime_type=mime_type,
                user_id=user_id,
                ocr_cache_repository=ocr_cache_repository,
            )
            if cached_result:
                logger.info("Cache hit for file: %s", file_path)
                return cached_result

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
                if response.text is None:
                    raise ValueError("Odpowiedź modelu jest pusta")
                parsed_data = AnalysisPayload.model_validate_json(response.text)
            
            # Upewniamy się, że parsed_data to AnalysisPayload
            if not isinstance(parsed_data, AnalysisPayload):
                if response.text is None:
                    raise ValueError("Odpowiedź modelu jest pusta")
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

        markdown_twin = parsed_data.markdown_twin.strip()
        routing_tier = parsed_data.to_tier()
        suggested_title = parsed_data.suggested_title

        # Save to cache if we have file_path, user_id and repository
        if file_path and user_id is not None and ocr_cache_repository:
            try:
                self._save_to_cache(
                    file_path=file_path,
                    filename=filename,
                    mime_type=mime_type,
                    user_id=user_id,
                    markdown_twin=markdown_twin,
                    routing_tier=routing_tier,
                    suggested_title=suggested_title,
                    ocr_cache_repository=ocr_cache_repository,
                )
            except Exception as exc:
                # Log error but don't fail the request
                logger.warning("Failed to save to OCR cache: %s", exc)

        return (
            markdown_twin,
            routing_tier,
            usage,
            suggested_title,
        )

    def _check_cache(
        self,
        *,
        file_path: str,
        filename: str | None,
        mime_type: str | None,
        user_id: int,
        ocr_cache_repository: OcrCacheRepository,
    ) -> tuple[str, RoutingTier, dict, str | None] | None:
        """Check if result exists in cache and return it if found."""
        try:
            file_hash = self._calculate_file_hash(file_path)
            cache_key = self._build_cache_key(
                file_hash=file_hash,
                filename=filename,
                mime_type=mime_type,
            )

            cached_entry = ocr_cache_repository.get_by_key(cache_key)
            if cached_entry:
                # Parse cached result (result_ref contains JSON with markdown_twin,
                # routing_tier, suggested_title)
                try:
                    cached_data = json.loads(cached_entry.result_ref)
                    markdown_twin = cached_data.get("markdown_twin", "")
                    routing_tier_str = cached_data.get("routing_tier", "fast")
                    suggested_title = cached_data.get("suggested_title")

                    # Convert routing_tier string to enum
                    routing_tier = RoutingTier.FAST
                    routing_lower = routing_tier_str.lower()
                    if "reasoning" in routing_lower or "slow" in routing_lower:
                        routing_tier = RoutingTier.REASONING

                    return (
                        markdown_twin,
                        routing_tier,
                        {},  # usage metadata not cached
                        suggested_title,
                    )
                except (json.JSONDecodeError, KeyError):
                    # Fallback: treat result_ref as plain markdown_twin
                    return (
                        cached_entry.result_ref,
                        RoutingTier.FAST,
                        {},
                        None,
                    )
        except Exception as exc:
            logger.warning("Error checking OCR cache: %s", exc)
        return None

    def _save_to_cache(
        self,
        *,
        file_path: str,
        filename: str | None,
        mime_type: str | None,
        user_id: int,
        markdown_twin: str,
        ocr_cache_repository: OcrCacheRepository,
        routing_tier: RoutingTier | None = None,
        suggested_title: str | None = None,
    ) -> None:
        """Save analysis result to cache."""
        try:
            file_hash = self._calculate_file_hash(file_path)
            ocr_options_hash = self._build_ocr_options_hash(
                filename=filename,
                mime_type=mime_type,
            )
            cache_key = self._build_cache_key(
                file_hash=file_hash,
                filename=filename,
                mime_type=mime_type,
            )

            # Store result as JSON for better structure
            result_data = {
                "markdown_twin": markdown_twin,
                "routing_tier": routing_tier.value if routing_tier else "fast",
                "suggested_title": suggested_title,
            }
            result_ref = json.dumps(result_data, ensure_ascii=False)

            cache_entry = OcrCache(
                id=None,
                user_id=user_id,
                file_hash=file_hash,
                ocr_options_hash=ocr_options_hash,
                pipeline_version=OCR_PIPELINE_VERSION,
                result_ref=result_ref,
                cache_key=cache_key,
            )

            ocr_cache_repository.add(cache_entry)
            logger.info("Saved to OCR cache: %s", cache_key)
        except Exception as exc:
            logger.warning("Error saving to OCR cache: %s", exc)
            raise

    @staticmethod
    def _calculate_file_hash(file_path: str) -> str:
        """Calculate SHA-256 hash of file content."""
        path = Path(file_path)
        if not path.exists():
            raise ValueError(f"File does not exist: {file_path}")

        sha256 = hashlib.sha256()
        with path.open("rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                sha256.update(chunk)
        return sha256.hexdigest()

    @staticmethod
    def _build_ocr_options_hash(
        filename: str | None,
        mime_type: str | None,
    ) -> str:
        """Build hash of OCR options (filename, mime_type, model)."""
        options = {
            "filename": filename or "",
            "mime_type": mime_type or "",
            "model": "gemini",  # Fixed for Gemini analyzer
        }
        return hash_payload(normalize_config(options))

    @staticmethod
    def _build_cache_key(
        file_hash: str,
        filename: str | None,
        mime_type: str | None,
    ) -> str:
        """Build cache key from file hash and OCR options."""
        ocr_options_hash = GeminiDocumentAnalyzer._build_ocr_options_hash(
            filename=filename,
            mime_type=mime_type,
        )
        return hash_payload(
            file_hash,
            ocr_options_hash,
            OCR_PIPELINE_VERSION,
        )

    def _handle_api_errors(self, exc: Exception) -> None:
        msg = str(exc).upper()
        if any(err in msg for err in ["RESOURCE_EXHAUSTED", "429", "QUOTA"]):
            raise ValueError("Limit zapytań Gemini przekroczony. Spróbuj za chwilę.")
        raise RuntimeError(f"Błąd Gemini API: {exc}") from exc

__all__ = ["GeminiDocumentAnalyzer"]