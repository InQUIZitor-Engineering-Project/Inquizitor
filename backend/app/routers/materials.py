# app/routers/materials.py
import os, uuid, hashlib
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Response
from sqlmodel import Session, select
try:
    import magic
    HAVE_MAGIC = True
except Exception:
    HAVE_MAGIC = False

from app.db.session import get_session
from app.db.models import File as FileModel, Material, User, ProcessingStatus
from app.routers.users import get_current_user
from app.schemas.material import MaterialOut, MaterialUpdate
from services.extract import extract_text_from_file

router = APIRouter(prefix="/materials", tags=["materials"])

BASE_UPLOAD_DIR = Path("uploads")
MATERIALS_DIR = BASE_UPLOAD_DIR / "materials"
MATERIALS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTS = {".pdf", ".docx", ".txt", ".md"} 

def _checksum_sha256(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as fp:
        for chunk in iter(lambda: fp.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()

@router.post("/upload", response_model=MaterialOut)
def upload_material(
    uploaded_file: UploadFile = File(...),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # 1) Walidacja rozszerzenia
    ext = os.path.splitext(uploaded_file.filename)[1].lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Allowed file types: {', '.join(sorted(ALLOWED_EXTS))}"
        )

    # 2) Zapis pliku na dysk
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = MATERIALS_DIR / unique_name
    content = uploaded_file.file.read()
    file_path.write_bytes(content)
    size_bytes = file_path.stat().st_size

    # 3) MIME + checksum
    if HAVE_MAGIC:
        try:
            mime_type = magic.from_file(str(file_path), mime=True)
        except Exception:
            mime_type = None
    else:
        mime_type = None

    checksum = _checksum_sha256(file_path)

    # 4) Surowy File (dla spójności z istniejącym modelem)
    db_file = FileModel(
        owner_id=current_user.id,
        filename=uploaded_file.filename,
        filepath=str(file_path),
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    # 5) Ekstrakcja tekstu
    extracted_text = extract_text_from_file(file_path, mime_type)

    # 6) Material
    mat = Material(
        owner_id=current_user.id,
        file_id=db_file.id,
        mime_type=mime_type,
        size_bytes=size_bytes,
        checksum=checksum,
        extracted_text=(extracted_text[:1_000_000] if extracted_text else None),  # safety limit
        processing_status="done" if extracted_text else "failed",
        processing_error=None if extracted_text else "Could not extract text (unsupported or empty)",
    )
    db.add(mat)
    db.commit()
    db.refresh(mat)

    return MaterialOut(
        **mat.model_dump(),
        filename=db_file.filename,
    )

@router.get("", response_model=List[MaterialOut])
def list_materials(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Material).where(Material.owner_id == current_user.id).order_by(Material.id.desc())
    rows = db.exec(stmt).all()

    out: List[MaterialOut] = []
    for m in rows:
        f = db.get(FileModel, m.file_id)
        out.append(MaterialOut(
            **m.model_dump(),
            filename=f.filename if f else "<unknown>"
        ))
    return out

@router.get("/{material_id}", response_model=MaterialOut)
def get_material(
    material_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    m = db.get(Material, material_id)
    if not m or m.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Material not found")
    f = db.get(FileModel, m.file_id)
    return MaterialOut(
        **m.model_dump(),
        filename=f.filename if f else "<unknown>"
    )

@router.patch("/{material_id}", response_model=MaterialOut)
def update_material(
    material_id: int,
    body: MaterialUpdate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    m = db.get(Material, material_id)
    if not m or m.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Material not found")

    if body.extracted_text is not None:
        m.extracted_text = body.extracted_text[:1_000_000]

    if body.processing_status is not None:
        m.processing_status = ProcessingStatus(body.processing_status)

    db.add(m)
    db.commit()
    db.refresh(m)

    f = db.get(FileModel, m.file_id) if m.file_id else None
    return MaterialOut(**m.model_dump(), filename=f.filename if f else "<unknown>")


@router.delete("/{material_id}", status_code=204)
def delete_material(
    material_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    m = db.get(Material, material_id)
    if not m or m.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Material not found")

    f = db.get(FileModel, m.file_id) if m.file_id else None

    db.delete(m)
    db.commit()

    if f:
        try:
            Path(f.filepath).unlink(missing_ok=True)
        except Exception:
            pass
        db.delete(f)
        db.commit()

    return Response(status_code=204)