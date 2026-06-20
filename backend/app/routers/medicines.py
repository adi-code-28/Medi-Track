from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.auth import get_current_user
from app.database import get_session
from app.models import Medicine, MedicineLog, User
from app.schemas import MedicineCreate, MedicineLogCreate, MedicineLogPublic, MedicinePublic

router = APIRouter(prefix="/api/medicines", tags=["medicines"])


@router.get("", response_model=list[MedicinePublic])
def list_medicines(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    meds = session.exec(
        select(Medicine).where(Medicine.user_id == user.id).order_by(Medicine.created_at.desc())
    ).all()
    return meds


@router.post("", response_model=MedicinePublic)
def create_medicine(
    data: MedicineCreate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    med = Medicine(user_id=user.id, **data.model_dump())
    session.add(med)
    session.commit()
    session.refresh(med)
    return med


@router.patch("/{medicine_id}/toggle")
def toggle_medicine(
    medicine_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    med = session.get(Medicine, medicine_id)
    if not med or med.user_id != user.id:
        raise HTTPException(status_code=404, detail="Medicine not found")
    med.is_active = not med.is_active
    session.add(med)
    session.commit()
    return {"is_active": med.is_active}


@router.delete("/{medicine_id}")
def delete_medicine(
    medicine_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    med = session.get(Medicine, medicine_id)
    if not med or med.user_id != user.id:
        raise HTTPException(status_code=404, detail="Medicine not found")
    session.delete(med)
    session.commit()
    return {"ok": True}


@router.get("/logs", response_model=list[MedicineLogPublic])
def list_logs(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    logs = session.exec(
        select(MedicineLog).where(MedicineLog.user_id == user.id).order_by(MedicineLog.scheduled_at.desc()).limit(50)
    ).all()
    return logs


@router.post("/logs", response_model=MedicineLogPublic)
def create_log(
    data: MedicineLogCreate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    med = session.get(Medicine, data.medicine_id)
    if not med or med.user_id != user.id:
        raise HTTPException(status_code=404, detail="Medicine not found")

    log = MedicineLog(
        user_id=user.id,
        medicine_id=data.medicine_id,
        scheduled_at=data.scheduled_at,
        status=data.status,
        taken_at=datetime.utcnow() if data.status == "taken" else None,
        notes=data.notes,
    )
    session.add(log)
    session.commit()
    session.refresh(log)
    return log
