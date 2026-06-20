from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.auth import get_current_user
from app.database import get_session
from app.models import Medicine, MedicineLog, Symptom, User, Vital
from app.schemas import DashboardStats
from app.services.health import compute_adherence, vital_to_public

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    vitals_count = len(session.exec(select(Vital).where(Vital.user_id == user.id)).all())
    medicines_active = len(
        session.exec(select(Medicine).where(Medicine.user_id == user.id, Medicine.is_active == True)).all()
    )
    week_ago = datetime.utcnow() - timedelta(days=7)
    symptoms_this_week = len(
        session.exec(
            select(Symptom).where(Symptom.user_id == user.id, Symptom.recorded_at >= week_ago)
        ).all()
    )
    latest_bp = session.exec(
        select(Vital)
        .where(Vital.user_id == user.id, Vital.type == "blood_pressure")
        .order_by(Vital.recorded_at.desc())
    ).first()

    return DashboardStats(
        vitals_count=vitals_count,
        medicines_active=medicines_active,
        adherence_pct=compute_adherence(session, user.id),
        symptoms_this_week=symptoms_this_week,
        latest_bp=vital_to_public(latest_bp) if latest_bp else None,
    )
