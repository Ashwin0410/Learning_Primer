# 🌱 Primer — Prakruthi's Learning Journey

A personal, AI-powered tutoring app that takes an **absolute beginner** (0 code, 0 math,
0 everything) all the way to **Full-Stack AI Engineer with cloud knowledge** — one warm,
confidence-building session at a time.

Pick any topic from the roadmap and **Primer** (an AI teacher powered by the Claude API)
teaches it from zero: what it is, how it works, why it matters, 10 practice problems, and
**one GitHub-worthy project** — all in a friendly chat with a live progress rail.

- **Backend:** FastAPI · Anthropic SDK (streaming + prompt caching) · SQLite
- **Frontend:** React + Vite + TypeScript + Tailwind
- **Curriculum:** 52 topics across 9 phases, from "What is a computer?" to RAG apps & Kubernetes

---

## What it looks like

```
┌─ 🐍 Python ──────────────────────────────┬─── Progress ─────────────┐
│  Primer: A variable is like a labeled     │  Concepts     4 / 20     │
│  box that holds a value. Think of it...   │  ▓▓▓▓░░░░░░░░░░░░░░       │
│                                            │  [Concepts][Practice]... │
│  Now you try: make a box called `age`.    │  ✓ What is code…         │
│  ▍                                         │  ✓ Variables & types     │
│  ─────────────────────────────────────    │  ● Operators   ← current │
│  [Continue →] [Explain again] [Exercise]  │  ○ Strings               │
│  Type your answer…                    [↑] │  🏆 CLI task manager     │
└────────────────────────────────────────────┴──────────────────────────┘
```

---

## Quick start

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** and npm
- An **Anthropic API key** → https://console.anthropic.com/ (the app runs without one, but
  the tutor will just ask you to add it before it can teach).

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt

# Configure — copy the example and add your key:
copy .env.example .env      # Windows
# cp .env.example .env      # macOS/Linux
# then edit .env and set ANTHROPIC_API_KEY=sk-ant-...

# Run the API:
uvicorn app.main:app --reload --port 8000
```

The API is now at http://localhost:8000 (interactive docs at `/docs`).

### 2. Frontend (a second terminal)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**, enter the passcode (default: `prakruthi`), and start learning. 🎉

---

## One-command production build

Build the frontend once; FastAPI will then serve the whole app (UI + API) on a single port:

```bash
cd frontend && npm run build      # produces frontend/dist
cd ../backend && uvicorn app.main:app --port 8000
```

Now everything is at **http://localhost:8000** — no separate frontend server needed.

---

## Configuration (`backend/.env`)

| Variable            | Default            | Notes |
|---------------------|--------------------|-------|
| `ANTHROPIC_API_KEY` | *(empty)*          | Required for the tutor to respond. |
| `PRIMER_MODEL`      | `claude-opus-4-8`  | The teaching model. **Switch to `claude-sonnet-5`** to cut cost ~5× — recommended for a full 0-to-hero journey with lots of content. |
| `PRIMER_PASSCODE`   | `prakruthi`        | The login passcode. Change it to anything. |
| `LEARNER_NAME`      | `Prakruthi`        | Shown throughout the UI; Primer greets her by name. |
| `DATABASE_URL`      | `sqlite:///./primer.db` | Where progress + chat history live. |
| `CORS_ORIGINS`      | `http://localhost:5173,...` | Allowed dev origins. |

> 💡 **Cost tip:** the large Primer system prompt is sent with **prompt caching** on every
> turn, so across a multi-hour session it's served from cache (~10% of the price) after the
> first message. Switching to Sonnet 5 saves even more.

---

## How it works

1. **The teaching brain** is the `Primer` system prompt (`backend/app/prompts.py`) — your
   original prompt, plus a small addendum so it teaches inside this chat UI.
2. **The curriculum** (`backend/app/curriculum.py`) is 52 topics grouped into 9 phases. Each
   topic carries its exact concept list and final project.
3. When Prakruthi opens a topic, the backend sends Claude the concept list and streams the
   lesson back token-by-token over **Server-Sent Events**.
4. Primer embeds invisible markers (`[CONCEPT DONE: …]`, `[SECTION: …]`) as it finishes each
   concept. The backend strips these from what she sees and uses them to **advance the
   progress rail** and save her place.
5. Everything is **resumable** — sessions, messages, and progress persist in SQLite, so she
   can stop and come back anytime.

---

## Project structure

```
Prakruthi Learning/
├── backend/
│   ├── app/
│   │   ├── main.py            FastAPI app (also serves the built frontend)
│   │   ├── config.py          Settings from .env
│   │   ├── prompts.py         The Primer teaching persona
│   │   ├── curriculum.py      52 topics · 9 phases · concept lists · projects
│   │   ├── anthropic_client.py  Streaming + prompt caching
│   │   ├── db.py / models.py / schemas.py
│   │   └── routers/           auth · curriculum · sessions · chat (SSE)
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    └── src/
        ├── pages/             Login · Dashboard · Curriculum · Session
        ├── components/        Markdown · ConceptRail · Header
        ├── lib/               api.ts (incl. SSE reader) · types.ts
        └── context/           AuthContext
```

---

## The learning path

**Foundations** → **Math** → **Programming** → **Data** → **Web & Full-Stack** →
**AI & Machine Learning** → **Engineering Craft** → **DevOps & Cloud** → **Career**

Start anywhere. Each topic is a complete, self-contained 4–5 hour session ending in a real
project she'll be proud to show. 💜
