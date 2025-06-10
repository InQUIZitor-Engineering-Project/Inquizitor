# app/routers/files.py
import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_session
from app.db.models import File as FileModel, User
from app.routers.users import get_current_user
from app.schemas.test import FileUploadResponse

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload-file", response_model=FileUploadResponse)
def upload_file(
    uploaded_file: UploadFile = File(...),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    ext = os.path.splitext(uploaded_file.filename)[1].lower()
    if ext not in [".pdf", ".png", ".jpg", ".jpeg"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Allowed file types: .pdf, .png, .jpg, .jpeg"
        )
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as f:
        content = uploaded_file.file.read()
        f.write(content)

    db_file = FileModel(
        owner_id=current_user.id,
        filename=uploaded_file.filename,
        filepath=file_path
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    return FileUploadResponse(file_id=db_file.id, filename=db_file.filename)

@router.post("/upload-text")
def upload_text(
    payload: dict,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Na razie zwracamy ten sam payload – będziemy podawać text do generowania testu.
    """
    return {"text": payload.get("text", "")}
