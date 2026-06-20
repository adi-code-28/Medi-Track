from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.database import get_session
from app.models import User
from app.schemas import UserPublic

router = APIRouter(prefix="/api/sos", tags=["sos"])


@router.get("/{user_id}", response_model=UserPublic)
def emergency_card(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Patient not found")
    return user
