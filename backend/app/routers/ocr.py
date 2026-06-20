import json
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile
from sqlmodel import Session

from app.auth import get_current_user
from app.config import settings
from app.database import get_session
from app.models import Medicine, OCRLog, User
from app.schemas import OCRConfirmRequest, PrescriptionOCRResult
from app.services.ocr import extract_prescription

router = APIRouter(prefix="/api/ocr", tags=["ocr"])

UPLOAD_DIR = Path(settings.upload_dir)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/prescription", response_model=PrescriptionOCRResult)
async def scan_prescription(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    ext = Path(file.filename or "rx.jpg").suffix or ".jpg"
    filename = f"{user.id}_{uuid.uuid4().hex}{ext}"
    filepath = UPLOAD_DIR / filename

    content = await file.read()
    filepath.write_bytes(content)

    result = await extract_prescription(filepath)

    log = OCRLog(
        user_id=user.id,
        image_path=str(filepath),
        result_json=result.model_dump_json(),
        confidence=result.confidence,
    )
    session.add(log)
    session.commit()

    return result


@router.post("/confirm")
def confirm_prescription(
    data: OCRConfirmRequest,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    created = []
    for med in data.medicines:
        medicine = Medicine(
            user_id=user.id,
            name=med.name,
            dosage=med.dosage,
            frequency=med.frequency,
            instructions=med.instructions,
        )
        session.add(medicine)
        created.append(medicine)
    session.commit()
    for m in created:
        session.refresh(m)
    return {"created": len(created), "medicines": [{"id": m.id, "name": m.name} for m in created]}
