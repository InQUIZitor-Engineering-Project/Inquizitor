from pathlib import Path
from typing import Annotated, Any

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse, RedirectResponse

from app.api.dependencies import get_export_storage, get_file_service
from app.api.schemas.tests import FileUploadResponse
from app.application.services import FileService
from app.core.security import get_current_user
from app.db.models import User
from app.domain.services import FileStorage
from app.infrastructure.storage import R2FileStorage

router = APIRouter()

_ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg"]


@router.post("/upload-file", response_model=FileUploadResponse)
def upload_file(
    uploaded_file: Annotated[UploadFile, File(...)],
    current_user: Annotated[User, Depends(get_current_user)],
    file_service: Annotated[FileService, Depends(get_file_service)],
) -> FileUploadResponse:
    if current_user.id is None:
        raise HTTPException(status_code=401, detail="User ID is missing")

    ext = Path(uploaded_file.filename or "").suffix.lower()
    if ext not in _ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Allowed file types: {', '.join(sorted(_ALLOWED_EXTENSIONS))}",
        )
    content = uploaded_file.file.read()
    return file_service.upload_file(
        owner_id=current_user.id,
        filename=uploaded_file.filename or "unknown",
        content=content,
        allowed_extensions=_ALLOWED_EXTENSIONS,
    )


@router.post("/upload-text")
def upload_text(
    payload: dict[str, Any],
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict[str, Any]:
    """Temporary endpoint returning the provided text payload."""
    _ = current_user
    return {"text": payload.get("text", "")}


@router.get("/exports/{file_path:path}")
def download_export(
    file_path: str,
    current_user: Annotated[User, Depends(get_current_user)],
    export_storage: Annotated[FileStorage, Depends(get_export_storage)],
) -> Response:
    # basic path traversal protection
    _ = current_user
    if ".." in file_path:
        raise HTTPException(status_code=400, detail="Invalid filename")

    # For R2 and other remote storages, proxy the file through the API to avoid CORS.
    if isinstance(export_storage, R2FileStorage):
        try:
            obj = export_storage._client.get_object(
                Bucket=export_storage._bucket, Key=file_path
            )
            data = obj["Body"].read()
            return Response(
                content=data,
                media_type=obj.get("ContentType") or "application/pdf",
                headers={
                    "Content-Disposition": (
                        f'attachment; filename="{Path(file_path).name}"'
                    )
                },
            )
        except Exception:
            # fall back to presigned URL redirect if direct fetch fails
            generated = export_storage.get_url(stored_path=file_path)
            if generated.startswith("http"):
                return RedirectResponse(url=generated)

    generated = export_storage.get_url(stored_path=file_path)
    if generated.startswith("http"):
        return RedirectResponse(url=generated)

    base = (
        Path(export_storage._base_dir)
        if hasattr(export_storage, "_base_dir")
        else Path("uploads/exports")
    )
    abs_path = (base / file_path).resolve()

    try:
        abs_path.relative_to(base.resolve())
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid path") from None

    if not abs_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=abs_path, media_type="application/pdf", filename=abs_path.name
    )


__all__ = ["router"]

