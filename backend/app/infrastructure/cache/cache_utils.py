from __future__ import annotations

import hashlib
import json
from typing import Any

PDF_TEMPLATE_VERSION = "v1"
OCR_PIPELINE_VERSION = "v1"


def normalize_config(payload: Any) -> str:
    """
    Normalize config payload to a stable JSON string for hashing.
    """
    if hasattr(payload, "model_dump"):
        payload = payload.model_dump()
    return json.dumps(payload, sort_keys=True, separators=(",", ":"))


def hash_payload(*parts: str) -> str:
    """
    Build a SHA-256 hash from string parts.
    """
    joined = "|".join(parts)
    return hashlib.sha256(joined.encode("utf-8")).hexdigest()


__all__ = [
    "PDF_TEMPLATE_VERSION",
    "OCR_PIPELINE_VERSION",
    "hash_payload",
    "normalize_config",
]

