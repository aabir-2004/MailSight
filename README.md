# MailLens 🔍

**AI-Powered Gmail Analysis Platform**

A self-hosted, zero-cost web app that connects to your Gmail account and surfaces hidden inbox intelligence through LLM-powered search, interactive charts, and a free-form custom query engine.

---

## ✨ Features

| Feature | Status |
|---|---|
| **Smart Search** — Semantic + keyword hybrid search with Groq LLM synthesis | ✅ Frontend complete |
| **Analytics Dashboard** — Volume, labels, senders, heatmap, thread depth | ✅ Frontend complete |
| **AI Analysis Studio** — Natural language → interactive chart via Groq LLM | ✅ Frontend complete |
| **Gmail OAuth Sync** — Read-only Gmail ingestion via Gmail API | 🔧 Backend scaffold |
| **pgvector Embeddings** — Sentence-transformer semantic search over email bodies | 🔧 Backend scaffold |
| **Custom Query Engine** — LLM translates queries to SQL-like analysis specs | ✅ Frontend + 🔧 Backend |

---

## 🏗 Architecture

```
frontend/  — React 18 + Vite + TypeScript + Recharts + TanStack Query
backend/   — Python 3.11 + FastAPI + Celery + Supabase + Groq API
```

## 🚀 Quick Start (Frontend — Mock Mode)

```bash
cd frontend
npm install
npm run dev        # → http://localhost:5173
```

The frontend runs fully in **mock mode** (`VITE_MOCK_MODE=true`) with rich demo data — no backend needed.

## 🔧 Backend Setup

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your keys
uvicorn app.main:app --reload
```

## 📦 Tech Stack (100% Free Tier)

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Recharts + TanStack Query + Zustand |
| Backend | FastAPI + Celery + APScheduler |
| Database | Supabase PostgreSQL + pgvector |
| LLM | Groq API — llama-3.1-8b-instant / mixtral-8x7b-32768 |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Cache | Upstash Redis |
| Hosting | Vercel (frontend) + Render.com (backend) |

## 🔑 Environment Variables

Copy `frontend/.env` and `backend/.env.example` and fill in:

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — [Google Cloud Console](https://console.cloud.google.com)
- `GROQ_API_KEY` — [console.groq.com](https://console.groq.com)
- `SUPABASE_URL` / keys — [supabase.com](https://supabase.com)
