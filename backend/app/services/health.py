from datetime import datetime, timedelta

from sqlmodel import Session, select

from app.models import Medicine, MedicineLog, Symptom, User, Vital
from app.schemas import VitalPublic


def vital_status(vital_type: str, value: float, value_secondary: float | None = None) -> str:
    if vital_type == "blood_pressure" and value_secondary is not None:
        if value >= 140 or value_secondary >= 90:
            return "critical"
        if value >= 130 or value_secondary >= 80:
            return "warning"
        return "normal"
    if vital_type == "blood_sugar":
        if value >= 200 or value <= 54:
            return "critical"
        if value >= 140 or value <= 70:
            return "warning"
        return "normal"
    if vital_type == "spo2":
        if value < 90:
            return "critical"
        if value < 95:
            return "warning"
        return "normal"
    if vital_type == "temperature":
        if value >= 39.0 or value <= 35.0:
            return "critical"
        if value >= 37.5:
            return "warning"
        return "normal"
    return "normal"


def vital_to_public(vital: Vital) -> VitalPublic:
    status = vital_status(vital.type, vital.value, vital.value_secondary)
    return VitalPublic(
        id=vital.id,
        type=vital.type,
        value=vital.value,
        value_secondary=vital.value_secondary,
        unit=vital.unit,
        notes=vital.notes,
        recorded_at=vital.recorded_at,
        status=status,
    )


def compute_adherence(session: Session, user_id: int, days: int = 7) -> float:
    since = datetime.utcnow() - timedelta(days=days)
    logs = session.exec(
        select(MedicineLog).where(
            MedicineLog.user_id == user_id,
            MedicineLog.scheduled_at >= since,
        )
    ).all()
    if not logs:
        return 100.0
    taken = sum(1 for log in logs if log.status == "taken")
    return round((taken / len(logs)) * 100, 1)


def gather_health_context(session: Session, user: User, days: int = 7) -> dict:
    since = datetime.utcnow() - timedelta(days=days)
    vitals = session.exec(
        select(Vital).where(Vital.user_id == user.id, Vital.recorded_at >= since).order_by(Vital.recorded_at.desc())
    ).all()
    symptoms = session.exec(
        select(Symptom).where(Symptom.user_id == user.id, Symptom.recorded_at >= since).order_by(Symptom.recorded_at.desc())
    ).all()
    medicines = session.exec(
        select(Medicine).where(Medicine.user_id == user.id, Medicine.is_active == True)
    ).all()
    adherence = compute_adherence(session, user.id, days)

    return {
        "profile": {
            "name": user.full_name,
            "age": user.age,
            "conditions": user.conditions,
            "allergies": user.allergies,
        },
        "vitals": [
            {
                "type": v.type,
                "value": v.value,
                "value_secondary": v.value_secondary,
                "unit": v.unit,
                "recorded_at": v.recorded_at.isoformat(),
            }
            for v in vitals
        ],
        "symptoms": [
            {"name": s.name, "severity": s.severity, "notes": s.notes, "recorded_at": s.recorded_at.isoformat()}
            for s in symptoms
        ],
        "medicines": [
            {"name": m.name, "dosage": m.dosage, "frequency": m.frequency} for m in medicines
        ],
        "adherence_pct": adherence,
    }
