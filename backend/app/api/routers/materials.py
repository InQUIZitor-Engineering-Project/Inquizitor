import os
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status

from app.api.dependencies import get_material_service
from app.api.schemas.materials import MaterialOut, MaterialUpdate
from app.application.services import MaterialService
from app.core.security import get_current_user
from app.db.models import User

router = APIRouter(prefix="/materials", tags=["materials"])

_ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"]


@router.post("/upload", response_model=MaterialOut)
def upload_material(
    uploaded_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    material_service: MaterialService = Depends(get_material_service),
):
    ext = os.path.splitext(uploaded_file.filename)[1].lower()
    if ext not in _ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Allowed file types: {', '.join(sorted(_ALLOWED_EXTENSIONS))}",
        )

    content = uploaded_file.file.read()
    return material_service.upload_material(
        owner_id=current_user.id,
        filename=uploaded_file.filename,
        content=content,
        allowed_extensions=_ALLOWED_EXTENSIONS,
    )


@router.get("", response_model=List[MaterialOut])
def list_materials(
    current_user: User = Depends(get_current_user),
    material_service: MaterialService = Depends(get_material_service),
):
    return material_service.list_materials(owner_id=current_user.id)


@router.get("/{material_id}", response_model=MaterialOut)
def get_material(
    material_id: int,
    current_user: User = Depends(get_current_user),
    material_service: MaterialService = Depends(get_material_service),
):
    try:
        return material_service.get_material(owner_id=current_user.id, material_id=material_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/{material_id}", response_model=MaterialOut)
def update_material(
    material_id: int,
    body: MaterialUpdate,
    current_user: User = Depends(get_current_user),
    material_service: MaterialService = Depends(get_material_service),
):
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
    current_user: User = Depends(get_current_user),
    material_service: MaterialService = Depends(get_material_service),
):
    try:
        material_service.delete_material(owner_id=current_user.id, material_id=material_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return Response(status_code=204)


__all__ = ["router"]

