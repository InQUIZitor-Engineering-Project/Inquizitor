"""Thumbnail generation for materials."""

from __future__ import annotations

import io
import math
from pathlib import Path

from PIL import Image

# A4 ratio: 210mm x 297mm = 1:1.414
A4_RATIO = math.sqrt(2)  # ~1.414
THUMBNAIL_WIDTH = 250
THUMBNAIL_HEIGHT = int(THUMBNAIL_WIDTH * A4_RATIO)  # ~354px


def generate_thumbnail_from_pdf(pdf_path: Path) -> bytes | None:
    """Generate thumbnail from first page of PDF."""
    try:
        from pdf2image import convert_from_path

        # Convert first page to image
        images = convert_from_path(str(pdf_path), first_page=1, last_page=1, dpi=150)
        if not images:
            return None

        image = images[0]
        return _resize_and_encode(image)
    except Exception:
        return None


def generate_thumbnail_from_image(image_path: Path) -> bytes | None:
    """Generate thumbnail from image file."""
    try:
        with Image.open(image_path) as img:
            # Convert to RGB if necessary (for PNG with transparency, etc.)
            if img.mode in ("RGBA", "LA", "P"):
                rgb_img = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "P":
                    img = img.convert("RGBA")
                rgb_img.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
                img = rgb_img
            elif img.mode != "RGB":
                img = img.convert("RGB")

            return _resize_and_encode(img)
    except Exception:
        return None


def _resize_and_encode(image: Image.Image) -> bytes:
    """Resize image to A4 ratio thumbnail and encode as JPEG."""
    # Calculate target size maintaining A4 ratio
    img_width, img_height = image.size
    img_ratio = img_height / img_width if img_width > 0 else A4_RATIO

    # If image is wider than A4 ratio, fit to width
    # If image is taller than A4 ratio, fit to height
    if img_ratio > A4_RATIO:
        # Image is taller - fit to height
        target_height = THUMBNAIL_HEIGHT
        target_width = int(target_height / img_ratio)
    else:
        # Image is wider - fit to width
        target_width = THUMBNAIL_WIDTH
        target_height = int(target_width * img_ratio)

    # Resize with high-quality resampling
    resized = image.resize((target_width, target_height), Image.Resampling.LANCZOS)

    # Create canvas with A4 ratio
    canvas = Image.new("RGB", (THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT), (255, 255, 255))
    
    # Center the resized image on canvas
    x_offset = (THUMBNAIL_WIDTH - target_width) // 2
    y_offset = (THUMBNAIL_HEIGHT - target_height) // 2
    canvas.paste(resized, (x_offset, y_offset))

    # Encode as JPEG
    buffer = io.BytesIO()
    canvas.save(buffer, format="JPEG", quality=85, optimize=True)
    return buffer.getvalue()


def can_generate_thumbnail(mime_type: str | None, filename: str | None) -> bool:
    """Check if thumbnail can be generated for this file type."""
    if not mime_type and not filename:
        return False
    
    # PDF
    is_pdf = mime_type == "application/pdf" or (
        filename and filename.lower().endswith(".pdf")
    )
    if is_pdf:
        return True
    
    # Images
    if mime_type and mime_type.startswith("image/"):
        return True
    
    if filename:
        ext = Path(filename).suffix.lower()
        if ext in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"}:
            return True
    
    return False

