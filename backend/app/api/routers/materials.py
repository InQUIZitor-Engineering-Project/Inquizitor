from pathlib import Path
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Request,
    Response,
    UploadFile,
    status,
)

from app.api.dependencies import get_job_service, get_material_service
from app.api.schemas.materials import (
    MaterialOut,
    MaterialUpdate,
    MaterialUploadEnqueueResponse,
)
from app.application.services import JobService, MaterialService
from app.core.limiter import limiter
from app.core.security import get_current_user
from app.db.models import User
from app.domain.models.enums import JobType
from app.tasks.materials import process_material_task

router = APIRouter(prefix="/materials", tags=["materials"])

_ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md", ".png", ".jpg", ".jpeg"]


@router.post("/upload", response_model=MaterialUploadEnqueueResponse)
@limiter.limit("10/minute")
def upload_material(
    request: Request,
    uploaded_file: Annotated[UploadFile, File(...)],
    current_user: Annotated[User, Depends(get_current_user)],
    material_service: Annotated[MaterialService, Depends(get_material_service)],
    job_service: Annotated[JobService, Depends(get_job_service)],
) -> MaterialUploadEnqueueResponse:
    if current_user.id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User ID is missing"
        )

    ext = Path(uploaded_file.filename or "").suffix.lower()
    if ext not in _ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Allowed file types: {', '.join(sorted(_ALLOWED_EXTENSIONS))}",
        )

    content = uploaded_file.file.read()
    material = material_service.upload_material(
        owner_id=current_user.id,
        filename=uploaded_file.filename or "unknown",
        content=content,
        allowed_extensions=_ALLOWED_EXTENSIONS,
    )

    job = job_service.create_job(
        owner_id=current_user.id,
        job_type=JobType.MATERIAL_PROCESSING,
        payload={"material_id": material.id},
    )
    process_material_task.delay(job.id, current_user.id, material.id)

    return MaterialUploadEnqueueResponse(
        job_id=job.id,
        status=job.status.value,
        material=material,
    )


@router.get("", response_model=list[MaterialOut])
def list_materials(
    current_user: Annotated[User, Depends(get_current_user)],
    material_service: Annotated[MaterialService, Depends(get_material_service)],
) -> list[MaterialOut]:
    if current_user.id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User ID is missing"
        )
    return material_service.list_materials(owner_id=current_user.id)


@router.get("/{material_id}", response_model=MaterialOut)
def get_material(
    material_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    material_service: Annotated[MaterialService, Depends(get_material_service)],
) -> MaterialOut:
    if current_user.id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User ID is missing"
        )
    try:
        return material_service.get_material(
            owner_id=current_user.id, material_id=material_id
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/{material_id}", response_model=MaterialOut)
def update_material(
    material_id: int,
    body: MaterialUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    material_service: Annotated[MaterialService, Depends(get_material_service)],
) -> MaterialOut:
    if current_user.id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User ID is missing"
        )
    try:
        return material_service.update_material(
            owner_id=current_user.id,
            material_id=material_id,
            payload=body,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.delete("/{material_id}", status_code=204)
def delete_material(
    material_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    material_service: Annotated[MaterialService, Depends(get_material_service)],
) -> Response:
    if current_user.id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User ID is missing"
        )
    try:
        material_service.delete_material(
            owner_id=current_user.id, material_id=material_id
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return Response(status_code=204)


__all__ = ["router"]

