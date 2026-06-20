# MediTrack - AI Health Companion

Personal health tracking & medication management app with AI-powered prescription OCR, health insights, doctor-visit prep chat, and PDF reports.

Built for hackathons: **FastAPI + React + Tailwind**, hospital-themed UI, demo-ready in minutes.

## Features

- **Auth & patient profile** - conditions, allergies, emergency contact
- **Vitals logger** - BP, sugar, temp, weight, SpO2, pulse with color-coded status
- **Trend charts** - blood pressure visualization with normal zones
- **Medicine reminders** - schedule, mark taken/missed, browser notifications
- **Symptom diary** - severity slider + notes
- **Prescription OCR** - upload photo -> AI extracts medicines -> confirm -> auto reminders
- **AI weekly insights** - plain-English summary from your data
- **Doctor prep chat** - grounded AI assistant for visit preparation
- **PDF health report** - doctor-readable download
- **Emergency SOS card** - public read-only link for first responders

## Tech Stack

| Layer | Stack |
|-------|-------|
| Backend | FastAPI, SQLModel, SQLite, JWT, WeasyPrint |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, Recharts |
| AI | Gemini 2.0 Flash or GPT-4o (optional - demo mode works without API keys) |

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+

### 1. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

App: http://localhost:5173

### 3. Demo Account

On first run, a demo user is seeded automatically:

- **Email:** `demo@meditrack.app`
- **Password:** `demo123`

Click **Use demo account** on the login page.

### 4. Enable Live AI (optional)

Copy `.env.example` to `backend/.env` and add:

```env
GEMINI_API_KEY=your_key_here
# or
OPENAI_API_KEY=your_key_here
AI_PROVIDER=gemini
```

Without API keys, OCR and AI features return realistic demo responses.

## Docker

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000

## Project Structure

```
Medi-Track/
+-- backend/
|   +-- app/
|   |   +-- main.py           # FastAPI entry
|   |   +-- models.py         # SQLModel entities
|   |   +-- schemas.py        # Pydantic request/response
|   |   +-- routers/          # API routes
|   |   \-- services/         # OCR, AI, PDF logic
|   \-- requirements.txt
+-- frontend/
|   \-- src/
|       +-- pages/            # Dashboard, Vitals, Scan, AI...
|       +-- components/       # Layout, UI primitives
|       \-- lib/api.ts        # API client
\-- docker-compose.yml
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get JWT token |
| GET | `/api/dashboard/stats` | Dashboard metrics |
| GET/POST | `/api/vitals` | Vitals CRUD |
| GET/POST | `/api/medicines` | Medicine management |
| POST | `/api/ocr/prescription` | Scan prescription image |
| GET | `/api/ai/insights` | Weekly AI summary |
| POST | `/api/ai/chat` | Doctor prep chat |
| GET | `/api/ai/report/pdf` | Download PDF report |
| GET | `/api/sos/{user_id}` | Emergency card (public) |

## Demo Script (3 min)

1. Login with demo account -> show dashboard with BP trend
2. **Scan Prescription** -> upload image -> review extracted meds -> confirm
3. Log a symptom -> show severity color coding
4. Open **AI Assistant** -> ask "What should I tell my doctor?"
5. Download PDF report -> show Emergency SOS link

## Disclaimer

MediTrack is not a medical device. Always consult a qualified healthcare professional for medical advice.

## License

MIT
