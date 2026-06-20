from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.auth import get_current_user
from app.database import get_session
from app.models import User, Vital
from app.schemas import VitalCreate, VitalPublic
from app.services.health import vital_to_public

router = APIRouter(prefix="/api/vitals", tags=["vitals"])


@router.get("", response_model=list[VitalPublic])
def list_vitals(
    type: str | None = None,
    limit: int = 50,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    query = select(Vital).where(Vital.user_id == user.id)
    if type:
        query = query.where(Vital.type == type)
    query = query.order_by(Vital.recorded_at.desc()).limit(limit)
    vitals = session.exec(query).all()
    return [vital_to_public(v) for v in vitals]


@router.post("", response_model=VitalPublic)
def create_vital(
    data: VitalCreate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    vital = Vital(
        user_id=user.id,
        type=data.type,
        value=data.value,
        value_secondary=data.value_secondary,
        unit=data.unit,
        notes=data.notes,
        recorded_at=data.recorded_at or __import__("datetime").datetime.utcnow(),
    )
    session.add(vital)
    session.commit()
    session.refresh(vital)
    return vital_to_public(vital)


@router.delete("/{vital_id}")
def delete_vital(
    vital_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    vital = session.get(Vital, vital_id)
    if not vital or vital.user_id != user.id:
        raise HTTPException(status_code=404, detail="Vital not found")
    session.delete(vital)
    session.commit()
    return {"ok": True}
