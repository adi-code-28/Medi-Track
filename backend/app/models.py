from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    full_name: str
    age: Optional[int] = None
    blood_group: Optional[str] = None
    conditions: Optional[str] = None
    allergies: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Vital(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    type: str = Field(index=True)
    value: float
    value_secondary: Optional[float] = None
    unit: str
    notes: Optional[str] = None
    recorded_at: datetime = Field(default_factory=datetime.utcnow)


class Medicine(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    name: str
    dosage: str
    frequency: str
    instructions: Optional[str] = None
    reminder_times: str = "08:00,20:00"
    start_date: datetime = Field(default_factory=datetime.utcnow)
    end_date: Optional[datetime] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MedicineLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    medicine_id: int = Field(foreign_key="medicine.id", index=True)
    scheduled_at: datetime
    status: str = "pending"
    taken_at: Optional[datetime] = None
    notes: Optional[str] = None


class Symptom(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    name: str
    severity: int = Field(ge=1, le=10)
    notes: Optional[str] = None
    recorded_at: datetime = Field(default_factory=datetime.utcnow)


class OCRLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    image_path: str
    result_json: str
    confidence: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
