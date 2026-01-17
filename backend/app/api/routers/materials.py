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
    MaterialAnalyzeRequest,
    MaterialAnalyzeResponse,
    MaterialDeepAnalyzeRequest,
    MaterialDeepAnalyzeResponse,
    MaterialOut,
    MaterialUpdate,
    MaterialUploadBatchResponse,
    MaterialUploadEnqueueResponse,
)
from app.application.services import JobService, MaterialService
from app.core.limiter import limiter
from app.core.security import get_current_user
from app.db.models import User
from app.domain.models.enums import JobType
from app.infrastructure.monitoring.posthog_client import analytics
from app.tasks.materials import analyze_material_task, process_material_task

router = APIRouter(prefix="/materials", tags=["materials"])

_ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md", ".png", ".jpg", ".jpeg"]
_MAX_TOTAL_PAGES = 20


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
    
    analytics.capture(
        user_id=current_user.id,
        event="material_processing_started",
        properties={
            "material_id": material.id,
            "filename": material.filename,
            "job_id": job.id,
            "mime_type": material.mime_type,
            "size_mb": (
                round(material.size_bytes / (1024 * 1024), 2)
                if material.size_bytes
                else 0
            ),
            "page_count": material.page_count,
        }
    )

    process_material_task.delay(job.id, current_user.id, material.id)

    return MaterialUploadEnqueueResponse(
        job_id=job.id,
        status=job.status.value,
        material=material,
    )


@router.post("/upload-batch", response_model=MaterialUploadBatchResponse)
@limiter.limit("10/minute")
def upload_material_batch(
    request: Request,
    uploaded_files: Annotated[list[UploadFile], File(...)],
    current_user: Annotated[User, Depends(get_current_user)],
    material_service: Annotated[MaterialService, Depends(get_material_service)],
) -> MaterialUploadBatchResponse:
    if current_user.id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User ID is missing"
        )

    if not uploaded_files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files uploaded",
        )

    materials: list[MaterialOut] = []
    for uploaded_file in uploaded_files:
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
        materials.append(material)

    return MaterialUploadBatchResponse(materials=materials)


@router.post("/analyze", response_model=MaterialAnalyzeResponse)
@limiter.limit("10/minute")
def analyze_materials(
    request: Request,
    payload: MaterialAnalyzeRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    material_service: Annotated[MaterialService, Depends(get_material_service)],
    job_service: Annotated[JobService, Depends(get_job_service)],
) -> MaterialAnalyzeResponse:
    if current_user.id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User ID is missing"
        )

    if not payload.material_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No materials selected",
        )

    materials: list[MaterialOut] = []
    for material_id in payload.material_ids:
        try:
            material = material_service.get_material(
                owner_id=current_user.id, material_id=material_id
            )
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        materials.append(material)

    total_pages = sum((material.page_count or 1) for material in materials)
    if total_pages > _MAX_TOTAL_PAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Limit stron przekroczony (max {_MAX_TOTAL_PAGES}).",
        )

    jobs = []
    for material in materials:
        job = job_service.create_job(
            owner_id=current_user.id,
            job_type=JobType.MATERIAL_PROCESSING,
            payload={"material_id": material.id},
        )

        analytics.capture(
            user_id=current_user.id,
            event="material_processing_started",
            properties={
                "material_id": material.id,
                "filename": material.filename,
                "job_id": job.id,
                "mime_type": material.mime_type,
                "size_mb": (
                    round(material.size_bytes / (1024 * 1024), 2)
                    if material.size_bytes
                    else 0
                ),
                "page_count": material.page_count,
            },
        )

        process_material_task.delay(job.id, current_user.id, material.id)

        jobs.append(
            {
                "job_id": job.id,
                "status": job.status.value,
                "material": material,
            }
        )

    return MaterialAnalyzeResponse(jobs=jobs, total_pages=total_pages)


@router.post("/analyze-deep", response_model=MaterialDeepAnalyzeResponse)
@limiter.limit("5/minute")
def analyze_materials_deep(
    request: Request,
    payload: MaterialDeepAnalyzeRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    material_service: Annotated[MaterialService, Depends(get_material_service)],
    job_service: Annotated[JobService, Depends(get_job_service)],
) -> MaterialDeepAnalyzeResponse:
    if current_user.id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User ID is missing"
        )

    if not payload.material_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No materials selected",
        )

    materials: list[MaterialOut] = []
    for material_id in payload.material_ids:
        try:
            material = material_service.get_material(
                owner_id=current_user.id, material_id=material_id
            )
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        materials.append(material)

    total_pages = sum((material.page_count or 1) for material in materials)
    if total_pages > _MAX_TOTAL_PAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Limit stron przekroczony (max {_MAX_TOTAL_PAGES}).",
        )

    jobs = []
    for material in materials:
        job = job_service.create_job(
            owner_id=current_user.id,
            job_type=JobType.MATERIAL_ANALYSIS,
            payload={"material_id": material.id},
        )

        analytics.capture(
            user_id=current_user.id,
            event="material_analysis_started",
            properties={
                "material_id": material.id,
                "filename": material.filename,
                "job_id": job.id,
                "mime_type": material.mime_type,
                "size_mb": (
                    round(material.size_bytes / (1024 * 1024), 2)
                    if material.size_bytes
                    else 0
                ),
                "page_count": material.page_count,
            },
        )

        analyze_material_task.delay(job.id, current_user.id, material.id)

        jobs.append(
            {
                "job_id": job.id,
                "status": job.status.value,
                "material": material,
            }
        )

    return MaterialDeepAnalyzeResponse(jobs=jobs, total_pages=total_pages)


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

