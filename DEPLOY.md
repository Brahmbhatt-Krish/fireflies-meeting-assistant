# Deployment Guide

Deploy **frontend** on Vercel and **backend** on Render (recommended for this assignment).

## Prerequisites

1. Public GitHub repository with `frontend/` and `backend/`
2. Do **not** commit `.env` or `.env.local` (they are gitignored)
3. Gemini API key (optional — app falls back to mock AI if missing)

---

## 1. Backend — Render (one-click Blueprint)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New** → **Blueprint**
3. Connect the repository — Render reads `render.yaml` at the repo root
4. When prompted, set environment variables:
   - `GEMINI_API_KEY` — your Gemini API key (optional)
   - `CORS_ORIGINS` — set after frontend deploy, e.g. `https://your-app.vercel.app`
5. Click **Apply** and wait for deploy
6. Note your API URL, e.g. `https://fireflies-api.onrender.com`
7. Verify: open `https://YOUR-API.onrender.com/docs`

### Render manual deploy (without Blueprint)

- **New → Web Service** → connect repo
- **Root Directory:** `backend`
- **Build:** `pip install -r requirements.txt`
- **Start:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Add the same env vars as above

### Docker (optional)

```bash
cd backend
docker build -t fireflies-api .
docker run -p 8000:8000 -e CORS_ORIGINS=http://localhost:3000 fireflies-api
```

---

## 2. Frontend — Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import the same GitHub repository
3. Configure:
   - **Root Directory:** `frontend`
   - **Framework:** Next.js (auto-detected; `vercel.json` included)
4. Environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://YOUR-API.onrender.com` (no trailing slash)
5. Deploy → note URL, e.g. `https://your-app.vercel.app`

---

## 3. Connect frontend ↔ backend

1. In **Render** → your service → **Environment**:
   ```
   CORS_ORIGINS=https://your-app.vercel.app
   ```
   For local dev too:
   ```
   CORS_ORIGINS=https://your-app.vercel.app,http://localhost:3000
   ```
2. **Save** and redeploy the backend
3. Open the Vercel URL — meetings should load

---

## 4. Submission links

| Deliverable | Example |
|---|---|
| GitHub | `https://github.com/you/fireflies-clone` |
| Live demo | `https://your-app.vercel.app` |

---

## Troubleshooting

| Issue | Fix |
|---|---|
| CORS error in browser | Set `CORS_ORIGINS` to exact Vercel URL (https, no trailing slash) |
| Empty meetings / API error | Check `NEXT_PUBLIC_API_URL`; redeploy Vercel after changing it |
| Slow first request (~30–60s) | Render free tier cold start — refresh once |
| Data resets after redeploy | Free tier SQLite is ephemeral; app auto-seeds 5 meetings on empty DB |
| Mock AI responses | Set `GEMINI_API_KEY` on Render and redeploy |

---

## Local development

```bash
# Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1   # Windows
pip install -r requirements.txt
# Copy .env.example → .env and set keys
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
# Copy .env.example → .env.local
npm run dev
```

Open `http://localhost:3000`
