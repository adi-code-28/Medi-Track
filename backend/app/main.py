from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import create_db_and_tables
from app.routers import ai, auth, dashboard, medicines, ocr, sos, symptoms, vitals
from app.seed import seed_demo_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    seed_demo_user()
    yield


app = FastAPI(
    title="MediTrack API",
    description="AI-powered personal health tracking & medication management",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_path = Path(settings.upload_dir)
upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(vitals.router)
app.include_router(medicines.router)
app.include_router(symptoms.router)
app.include_router(ocr.router)
app.include_router(ai.router)
app.include_router(sos.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "MediTrack"}
