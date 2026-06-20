from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    blood_group: Optional[str] = None
    conditions: Optional[str] = None
    allergies: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None


class UserPublic(BaseModel):
    id: int
    email: str
    full_name: str
    age: Optional[int] = None
    blood_group: Optional[str] = None
    conditions: Optional[str] = None
    allergies: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    created_at: datetime


class VitalCreate(BaseModel):
    type: str
    value: float
    value_secondary: Optional[float] = None
    unit: str
    notes: Optional[str] = None
    recorded_at: Optional[datetime] = None


class VitalPublic(BaseModel):
    id: int
    type: str
    value: float
    value_secondary: Optional[float] = None
    unit: str
    notes: Optional[str] = None
    recorded_at: datetime
    status: Literal["normal", "warning", "critical"] = "normal"


class MedicineCreate(BaseModel):
    name: str
    dosage: str
    frequency: str
    instructions: Optional[str] = None
    reminder_times: str = "08:00,20:00"
    end_date: Optional[datetime] = None


class MedicinePublic(BaseModel):
    id: int
    name: str
    dosage: str
    frequency: str
    instructions: Optional[str] = None
    reminder_times: str
    start_date: datetime
    end_date: Optional[datetime] = None
    is_active: bool
    created_at: datetime


class MedicineLogCreate(BaseModel):
    medicine_id: int
    scheduled_at: datetime
    status: Literal["taken", "missed", "skipped"]
    notes: Optional[str] = None


class MedicineLogPublic(BaseModel):
    id: int
    medicine_id: int
    scheduled_at: datetime
    status: str
    taken_at: Optional[datetime] = None
    notes: Optional[str] = None


class SymptomCreate(BaseModel):
    name: str
    severity: int = Field(ge=1, le=10)
    notes: Optional[str] = None
    recorded_at: Optional[datetime] = None


class SymptomPublic(BaseModel):
    id: int
    name: str
    severity: int
    notes: Optional[str] = None
    recorded_at: datetime


class ExtractedMedicine(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration_days: Optional[int] = None
    instructions: Optional[str] = None


class PrescriptionOCRResult(BaseModel):
    medicines: list[ExtractedMedicine]
    doctor_name: Optional[str] = None
    confidence: Literal["high", "medium", "low"] = "medium"
    raw_notes: Optional[str] = None


class OCRConfirmRequest(BaseModel):
    medicines: list[ExtractedMedicine]


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str
    sources: list[str] = []


class InsightResponse(BaseModel):
    summary: str
    action_items: list[str]
    generated_at: datetime


class DashboardStats(BaseModel):
    vitals_count: int
    medicines_active: int
    adherence_pct: float
    symptoms_this_week: int
    latest_bp: Optional[VitalPublic] = None
