"""Thumbnail generation utilities."""

from .generator import (
    can_generate_thumbnail,
    generate_thumbnail_from_image,
    generate_thumbnail_from_pdf,
)

__all__ = [
    "can_generate_thumbnail",
    "generate_thumbnail_from_image",
    "generate_thumbnail_from_pdf",
]

