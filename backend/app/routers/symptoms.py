from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.auth import get_current_user
from app.database import get_session
from app.models import Symptom, User
from app.schemas import SymptomCreate, SymptomPublic

router = APIRouter(prefix="/api/symptoms", tags=["symptoms"])


@router.get("", response_model=list[SymptomPublic])
def list_symptoms(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    symptoms = session.exec(
        select(Symptom).where(Symptom.user_id == user.id).order_by(Symptom.recorded_at.desc()).limit(50)
    ).all()
    return symptoms


@router.post("", response_model=SymptomPublic)
def create_symptom(
    data: SymptomCreate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    symptom = Symptom(
        user_id=user.id,
        name=data.name,
        severity=data.severity,
        notes=data.notes,
        recorded_at=data.recorded_at or __import__("datetime").datetime.utcnow(),
    )
    session.add(symptom)
    session.commit()
    session.refresh(symptom)
    return symptom


@router.delete("/{symptom_id}")
def delete_symptom(
    symptom_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    symptom = session.get(Symptom, symptom_id)
    if not symptom or symptom.user_id != user.id:
        raise HTTPException(status_code=404, detail="Symptom not found")
    session.delete(symptom)
    session.commit()
    return {"ok": True}
