import os

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.api.dependencies import get_file_service
from app.api.schemas.tests import FileUploadResponse
from app.application.services import FileService
from app.core.security import get_current_user
from app.db.models import User

router = APIRouter()

_ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg"]


@router.post("/upload-file", response_model=FileUploadResponse)
def upload_file(
    uploaded_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    file_service: FileService = Depends(get_file_service),
):
    ext = os.path.splitext(uploaded_file.filename)[1].lower()
    if ext not in _ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Allowed file types: {', '.join(sorted(_ALLOWED_EXTENSIONS))}",
        )
    content = uploaded_file.file.read()
    return file_service.upload_file(
        owner_id=current_user.id,
        filename=uploaded_file.filename,
        content=content,
        allowed_extensions=_ALLOWED_EXTENSIONS,
    )


@router.post("/upload-text")
def upload_text(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    """Temporary endpoint returning the provided text payload."""
    return {"text": payload.get("text", "")}


__all__ = ["router"]

