from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlmodel import Session

from app.auth import get_current_user
from app.database import get_session
from app.models import User
from app.schemas import ChatRequest, ChatResponse, InsightResponse
from app.services.ai import chat_with_context, generate_insights
from app.services.health import gather_health_context
from app.services.pdf import generate_pdf_bytes

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.get("/insights", response_model=InsightResponse)
async def get_insights(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    context = gather_health_context(session, user)
    return await generate_insights(context)


@router.post("/chat", response_model=ChatResponse)
async def chat(
    data: ChatRequest,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    context = gather_health_context(session, user)
    history = [{"role": m.role, "content": m.content} for m in data.history]
    return await chat_with_context(data.message, context, history)


@router.get("/report/pdf")
def download_report(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    pdf_bytes = generate_pdf_bytes(user, session)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="meditrack-report-{user.id}.pdf"'},
    )
