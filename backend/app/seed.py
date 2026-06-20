from datetime import datetime, timedelta

from sqlmodel import Session, select

from app.auth import hash_password
from app.database import engine
from app.models import Medicine, MedicineLog, Symptom, User, Vital


def seed_demo_user() -> None:
    with Session(engine) as session:
        existing = session.exec(select(User).where(User.email == "demo@meditrack.app")).first()
        if existing:
            return

        user = User(
            email="demo@meditrack.app",
            hashed_password=hash_password("demo123"),
            full_name="Ravi Kumar",
            age=58,
            blood_group="B+",
            conditions="Hypertension, Type 2 Diabetes",
            allergies="Penicillin",
            emergency_contact_name="Priya Kumar",
            emergency_contact_phone="+91 98765 43210",
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        now = datetime.utcnow()
        vitals_data = [
            ("blood_pressure", 128, 82, "mmHg", now - timedelta(days=6)),
            ("blood_pressure", 132, 84, "mmHg", now - timedelta(days=5)),
            ("blood_pressure", 138, 88, "mmHg", now - timedelta(days=4)),
            ("blood_pressure", 135, 86, "mmHg", now - timedelta(days=3)),
            ("blood_pressure", 142, 90, "mmHg", now - timedelta(days=2)),
            ("blood_pressure", 136, 85, "mmHg", now - timedelta(days=1)),
            ("blood_sugar", 118, None, "mg/dL", now - timedelta(days=2)),
            ("blood_sugar", 132, None, "mg/dL", now - timedelta(days=1)),
        ]
        for vtype, val, val2, unit, recorded in vitals_data:
            session.add(
                Vital(
                    user_id=user.id,
                    type=vtype,
                    value=val,
                    value_secondary=val2,
                    unit=unit,
                    recorded_at=recorded,
                )
            )

        med1 = Medicine(
            user_id=user.id,
            name="Amlodipine",
            dosage="5mg",
            frequency="Once daily",
            instructions="Take after breakfast",
            reminder_times="08:00",
        )
        med2 = Medicine(
            user_id=user.id,
            name="Metformin",
            dosage="500mg",
            frequency="Twice daily",
            instructions="Take with meals",
            reminder_times="08:00,20:00",
        )
        session.add(med1)
        session.add(med2)
        session.commit()
        session.refresh(med1)
        session.refresh(med2)

        for i in range(5):
            session.add(
                MedicineLog(
                    user_id=user.id,
                    medicine_id=med1.id,
                    scheduled_at=now - timedelta(days=i, hours=8),
                    status="taken" if i < 4 else "missed",
                    taken_at=now - timedelta(days=i, hours=8) if i < 4 else None,
                )
            )

        symptoms = [
            ("Headache", 4, now - timedelta(days=3)),
            ("Fatigue", 6, now - timedelta(days=1)),
        ]
        for name, severity, recorded in symptoms:
            session.add(Symptom(user_id=user.id, name=name, severity=severity, recorded_at=recorded))

        session.commit()
