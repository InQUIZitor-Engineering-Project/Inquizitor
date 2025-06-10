import pytesseract
from PIL import Image

def ocr_extract_text(image_path: str) -> str:
    try:
        img = Image.open(image_path)
        text = pytesseract.image_to_string(img, lang="pol")
        return text
    except Exception as e:
        return ""
