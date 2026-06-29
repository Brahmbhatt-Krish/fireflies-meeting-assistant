# Fireflies.ai Clone — Meeting Notes & Transcription Platform

A full-stack web application that recreates the Fireflies.ai post-meeting experience: browse a meetings library, read interactive transcripts with speaker labels and timestamps, review AI-generated summaries and action items, and manage meeting data through a clean, productivity-focused interface.

Built as an **SDE Fullstack Assignment**. Real speech-to-text is out of scope — transcripts are seeded, uploaded (`.txt` / `.vtt` / `.json`), or pasted, and AI summaries are generated via Google Gemini with a graceful mock fallback.

---

## Live Demo & Repository

| | Link |
|---|---|
| **Live application** | [_URL ](https://fireflies-meeting-assistant.vercel.app/) |
| **GitHub repository** | [_URL_](https://github.com/Brahmbhatt-Krish/fireflies-meeting-assistant) |

See **[DEPLOY.md](./DEPLOY.md)** for step-by-step hosting on Vercel (frontend) and Render (backend).

---

## Features

### Core (assignment requirements)

- **Meetings library** — grid of past meetings with title, date, duration, participants, and status badges
- **Search & filter** — by title, participant, and date range; sort by recency
- **Interactive transcript** — speaker avatars, timestamps, click-to-seek, in-transcript search with highlighted matches
- **Simulated media player** — seek bar syncs playback time with transcript highlighting (no real audio required)
- **AI summary & notes** — overview text, key topics with jump-to-timestamp, extracted action items
- **Meeting CRUD** — create (paste or upload transcript), edit title / date / participants, delete
- **Action item CRUD** — add, edit, complete, and delete tasks with optional assignees
- **Fireflies-style UX** — sidebar navigation, two-pane detail layout, modals, toasts, dark mode

### Bonus features implemented

- **Meeting chat** — LLM-powered Q&A about a specific meeting (`Ask AI` panel)
- **PDF export** — download meeting summary as PDF
- **Dark mode** — theme toggle persisted in local storage

### Placeholders (Coming Soon)

Sidebar stubs for live call bot, integrations (Zoom, Meet, CRM), team sharing, and real authentication. The app assumes a default logged-in user.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Lucide React, date-fns |
| **Backend** | FastAPI, Python 3.12+, SQLAlchemy 2, Pydantic v2, Uvicorn |
| **Database** | SQLite (normalized schema, cascading deletes) |
| **AI** | Google Gemini API with structured JSON output, retry logic, and offline mock fallback |
| **Deployment** | Vercel (frontend), Render Blueprint (backend), optional Docker |

---

## Project Structure

```
Assignment/
├── frontend/                 # Next.js app
│   ├── app/                  # Pages: /, /meetings/new, /meetings/[id]
│   ├── components/           # UI, layout, meeting detail panels
│   ├── hooks/                # usePlayer, useDebounce, useToast
│   ├── lib/api.ts            # REST client
│   └── types/                # TypeScript interfaces
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI entry + lifespan seed
│   │   ├── models/           # SQLAlchemy ORM
│   │   ├── schemas/          # Pydantic request/response models
│   │   ├── routers/          # meetings, action_items
│   │   └── services/         # transcript_parser, ai_generator, pdf_export
│   ├── seed/                 # 5 sample meetings
│   └── tests/                # API + parser tests
├── render.yaml               # Render one-click deploy
├── DEPLOY.md                 # Hosting guide
└── README.md
```

---

## Local Setup

### Prerequisites

- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv venv

# Windows PowerShell
.\venv\Scripts\Activate.ps1

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Copy environment variables:

```bash
cp .env.example .env
```

Edit `backend/.env`:

```ini
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=sqlite:///./fireflies.db
CORS_ORIGINS=http://localhost:3000
```

Start the API (creates tables and seeds 5 meetings if the database is empty):

```bash
uvicorn app.main:app --reload --port 8000
```

- API: [http://localhost:8000](http://localhost:8000)
- Swagger docs: [http://localhost:8000/docs](http://localhost:8000/docs)

Run tests:

```bash
python -m pytest tests/ -q
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
```

Edit `frontend/.env.local`:

```ini
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Architecture

```
┌──────────────────────────────────────────────┐
│           Next.js Frontend (React 19)         │
│  /              — Meetings library            │
│  /meetings/new  — Create meeting              │
│  /meetings/[id] — Transcript + summary view   │
└──────────────────────┬───────────────────────┘
                       │  REST (JSON / multipart)
┌──────────────────────▼───────────────────────┐
│              FastAPI Backend (Python)          │
│  Routers: meetings, action-items             │
│  Services: transcript_parser, ai_generator,  │
│            pdf_export                          │
└──────────┬─────────────────────┬─────────────┘
           │ SQLAlchemy          │ Google Gemini
┌──────────▼──────────┐  ┌──────▼─────────────┐
│ SQLite (6 tables)   │  │ Gemini / mock AI   │
└─────────────────────┘  └────────────────────┘
```

**Data flow**

1. User uploads or pastes a transcript → backend parses lines with speaker and timestamps.
2. Optional AI generation → Gemini returns summary, topics, and action items (or mock if unavailable).
3. Detail view uses a simulated player clock to highlight and scroll the active transcript line.
4. All entities persist in SQLite with foreign-key cascades on meeting delete.

---

## Database Schema

Six normalized tables with foreign keys and `ON DELETE CASCADE`:

| Table | PK | Relationships | Key columns |
|---|---|---|---|
| `meetings` | `id` | parent | `title`, `date`, `duration_sec`, `status`, `audio_url`, timestamps |
| `participants` | `id` | `meeting_id → meetings.id` | `name`, `email` |
| `transcript_lines` | `id` | `meeting_id → meetings.id` | `speaker`, `start_sec`, `end_sec`, `text`, `order_index` |
| `summaries` | `id` | `meeting_id → meetings.id` (1:1 unique) | `overview_text`, `generated_at` |
| `topics` | `id` | `meeting_id → meetings.id` | `title`, `start_sec`, `order_index` |
| `action_items` | `id` | `meeting_id → meetings.id` | `text`, `assignee`, `completed`, `created_at` |

Deleting a meeting removes all related participants, transcript lines, summary, topics, and action items.

---

## API Overview

Base URL: `http://localhost:8000` (local) or your Render URL (production).

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |

### Meetings

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/meetings` | List meetings — query: `search`, `participant`, `date_from`, `date_to`, `sort` |
| `POST` | `/api/meetings` | Create meeting (multipart: title, date, participants, transcript text/file, `generate_ai`) |
| `GET` | `/api/meetings/{id}` | Full meeting detail |
| `PATCH` | `/api/meetings/{id}` | Update title, date, and/or participants |
| `DELETE` | `/api/meetings/{id}` | Delete meeting and all child records |
| `POST` | `/api/meetings/{id}/generate` | Regenerate AI summary, topics, and action items |
| `POST` | `/api/meetings/{id}/chat` | Ask a question about the meeting (Gemini) |
| `GET` | `/api/meetings/{id}/export-summary.pdf` | Download summary PDF |
| `GET` | `/api/meetings/{id}/action-items` | List action items |
| `POST` | `/api/meetings/{id}/action-items` | Create action item |

### Action Items

| Method | Path | Description |
|---|---|---|
| `PATCH` | `/api/action-items/{id}` | Update text, assignee, or completed flag |
| `DELETE` | `/api/action-items/{id}` | Delete action item |

Interactive API docs: `/docs`

---

## Seed Data

On startup, if the database has no meetings, the backend seeds **5 sample meetings**:

1. Q3 Sprint 14 Planning  
2. Sales Discovery Call — Innovate Corp  
3. 1:1 Check-in — James Wilson  
4. Daily Standup — Engineering  
5. Client Kickoff — TechBridge x Innovate Corp  

Each includes full transcripts (15–40 lines), summaries, topics with timestamps, and action items.

---

## Assumptions & Design Choices

**Transcript formats**

- **Plain text** — `Speaker Name: dialogue` per line; timestamps estimated evenly across duration (or from word count if duration is unknown).
- **WebVTT** — parses cue timestamps and `<v Speaker>` tags or speaker-prefixed lines.
- **JSON** — array of `{ speaker, start_sec, end_sec?, text }`.

**Simulated audio player**

Real audio transcription is out of scope. Playback is a JavaScript timer (250 ms ticks) from `0` to `duration_sec`. `currentTime` drives transcript highlighting, auto-scroll, and topic seek.

**AI generation**

Gemini is called with a structured JSON prompt. The service tries available Gemini models (`gemini-2.5-flash`, etc.) with retries. If the API key is missing or the call fails, responses are prefixed with `[AI UNAVAILABLE — MOCK RESPONSE]` so the UI never breaks.

**Topic timestamps**

Topic start times are derived by keyword-matching topic titles against transcript lines. Unmatched topics fall back to proportional placement across meeting duration.

**Authentication**

No real auth — a placeholder user is shown in the navbar and sidebar.

**Deployment**

SQLite on Render free tier may reset on redeploy; auto-seed restores demo data when the DB is empty.

---

## Deployment

Production setup uses **Vercel** for the frontend and **Render** for the backend.

| File | Purpose |
|---|---|
| `render.yaml` | One-click Render Blueprint |
| `backend/Dockerfile` | Optional container deploy |
| `frontend/vercel.json` | Vercel build configuration |

Full instructions: **[DEPLOY.md](./DEPLOY.md)**

Quick summary:

1. Push to a public GitHub repo.
2. Deploy backend via Render Blueprint → set `GEMINI_API_KEY` and `CORS_ORIGINS`.
3. Deploy frontend on Vercel with root `frontend/` → set `NEXT_PUBLIC_API_URL`.
4. Update `CORS_ORIGINS` on Render with your Vercel URL and redeploy.

---

## License

Built for educational / assignment purposes.
