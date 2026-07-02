"""Streaming chat endpoint — where Primer actually teaches.

Wire format: Server-Sent Events. Each event is `data: <json>\n\n` with one of:
  {"type": "delta",   "text": "..."}                         incremental token(s)
  {"type": "done",    "section": "...", "completed_concepts": [...],
                       "status": "...", "message_id": 123}    end of turn
  {"type": "error",   "message": "..."}                       something went wrong

Primer embeds invisible progress markers on their own lines:
  [CONCEPT DONE: <exact concept name>]
  [SECTION: concepts|practice|project|complete]
We strip those from what the learner sees and use them to advance the progress rail.
"""
from __future__ import annotations

import json
import re
from collections.abc import Iterator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from .. import activity, anthropic_client, curriculum as cur
from ..config import get_settings
from ..db import SessionLocal, get_db
from ..models import LearningSession, Message
from ..prompts import build_system_prompt
from ..schemas import ChatRequest
from .auth import require_auth

router = APIRouter(tags=["chat"], dependencies=[Depends(require_auth)])
settings = get_settings()

_CONCEPT_MARKER = re.compile(r"^\s*\[CONCEPT DONE:\s*(.+?)\]\s*$", re.IGNORECASE)
_SECTION_MARKER = re.compile(r"^\s*\[SECTION:\s*(concepts|practice|project|complete)\s*\]\s*$", re.IGNORECASE)
_PROBLEM_MARKER = re.compile(r"^\s*\[PROBLEM DONE\]\s*$", re.IGNORECASE)
_PROJECT_MARKER = re.compile(r"^\s*\[PROJECT DONE\]\s*$", re.IGNORECASE)
_VALID_SECTIONS = {"concepts", "practice", "project", "complete"}


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


def _build_kickoff(topic: dict) -> str:
    numbered = "\n".join(f"{i}. {c}" for i, c in enumerate(topic["concepts"], start=1))
    tool = topic.get("tool") or "pen & paper (we'll work through everything visually)"
    return (
        f"I'm ready to learn **{topic['title']}** with you. Teach me this topic "
        f"following your full Primer structure.\n\n"
        f"Here is the official concept list to cover, in order — teach one at a time and "
        f"mark each finished:\n{numbered}\n\n"
        f"After the concepts, give me {cur.PROBLEMS_TARGET} practice problems (one at a "
        f"time), then walk me through 4-5 real GitHub-worthy projects that ramp in "
        f"difficulty. Make the flagship capstone project: {topic['project']}.\n"
        f"Recommended free practice tool: {tool}.\n\n"
        f"Begin now with Part 1 (What is this?)."
    )


@router.post("/chat")
def chat(body: ChatRequest, db: Session = Depends(get_db)):
    session = db.get(LearningSession, body.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    topic = cur.get_topic(session.topic_id)
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")

    user_text = (body.message or "").strip()

    # Persist the learner's message (if any) before generating.
    if user_text:
        db.add(Message(session_id=session.id, role="user", content=user_text))
        db.commit()

    # Build the API conversation: synthetic kickoff, then the stored history.
    history = [{"role": m.role, "content": m.content} for m in session.messages]
    api_messages: list[dict] = [{"role": "user", "content": _build_kickoff(topic)}] + history
    if api_messages[-1]["role"] == "assistant":
        # No fresh user turn to answer (e.g. a bare "continue"): nudge Primer forward.
        api_messages.append({"role": "user", "content": "Please continue."})

    system_prompt = build_system_prompt(settings.learner_name)
    session_id = session.id
    concept_list = list(topic["concepts"])

    def event_stream() -> Iterator[str]:
        clean_parts: list[str] = []
        pending = ""  # holds a partial trailing line between chunks
        newly_done: list[str] = []
        new_section: str | None = None
        counters = {"problems": 0, "projects": 0}

        def handle_line(line: str) -> str | None:
            """Return the line's text to emit, or None if it is a marker to suppress."""
            nonlocal new_section
            m = _CONCEPT_MARKER.match(line)
            if m:
                name = m.group(1).strip()
                match = next((c for c in concept_list if c.strip().lower() == name.lower()), None)
                if match and match not in newly_done:
                    newly_done.append(match)
                return None
            if _PROBLEM_MARKER.match(line):
                counters["problems"] += 1
                return None
            if _PROJECT_MARKER.match(line):
                counters["projects"] += 1
                return None
            m = _SECTION_MARKER.match(line)
            if m:
                new_section = m.group(1).lower()
                return None
            return line

        try:
            if anthropic_client.is_configured():
                raw_iter = anthropic_client.stream_raw(system_prompt, api_messages)
            else:
                raw_iter = iter([_no_key_message()])

            for chunk in raw_iter:
                pending += chunk
                # Emit complete lines; hold back the last (still-partial) line.
                while "\n" in pending:
                    line, pending = pending.split("\n", 1)
                    result = handle_line(line)
                    if result is not None:
                        out = result + "\n"
                        clean_parts.append(out)
                        yield _sse({"type": "delta", "text": out})
            # Flush the final partial line (no trailing newline).
            if pending:
                result = handle_line(pending)
                if result:
                    clean_parts.append(result)
                    yield _sse({"type": "delta", "text": result})
        except Exception as exc:  # noqa: BLE001 — surface any API/streaming error to the client
            yield _sse({"type": "error", "message": _friendly_error(exc)})
            return

        clean_text = "".join(clean_parts).strip()

        # Persist results with a fresh DB session (this runs in a threadpool thread).
        status = "active"
        section = None
        completed: list[str] = []
        problems_done = 0
        projects_done = 0
        msg_id = None
        streak_milestone: int | None = None
        write_db = SessionLocal()
        try:
            s = write_db.get(LearningSession, session_id)
            if s is not None:
                if clean_text:
                    write_db.add(Message(session_id=s.id, role="assistant", content=clean_text))
                existing_done = s.completed_concept_list
                for name in newly_done:
                    if name not in existing_done:
                        existing_done.append(name)
                s.completed_concepts = "\n".join(existing_done)
                s.problems_done = min(cur.PROBLEMS_TARGET, (s.problems_done or 0) + counters["problems"])
                s.projects_done = min(cur.PROJECTS_TARGET, (s.projects_done or 0) + counters["projects"])
                just_completed = new_section == "complete" and s.status != "complete"
                if new_section in _VALID_SECTIONS:
                    s.section = new_section
                if s.section == "complete" or new_section == "complete":
                    s.status = "complete"
                write_db.commit()
                write_db.refresh(s)
                status = s.status
                section = s.section
                completed = s.completed_concept_list
                problems_done = s.problems_done
                projects_done = s.projects_done
                msg_id = s.messages[-1].id if s.messages else None

                # Record today's activity + progress and detect new streak badges.
                new_milestones = activity.record_activity(
                    write_db,
                    topic_title=s.topic_title,
                    concepts=len(newly_done),
                    problems=counters["problems"],
                    projects=counters["projects"],
                    completed_topic=just_completed,
                )
                if new_milestones:
                    streak_milestone = max(new_milestones)
        finally:
            write_db.close()

        yield _sse(
            {
                "type": "done",
                "section": section,
                "completed_concepts": completed,
                "problems_done": problems_done,
                "projects_done": projects_done,
                "status": status,
                "streak_milestone": streak_milestone,
                "message_id": msg_id,
            }
        )

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def _no_key_message() -> str:
    return (
        "### 👋 Almost ready!\n\n"
        "I'd love to start teaching, but the app doesn't have an **Anthropic API key** yet, "
        "so I can't think out loud.\n\n"
        "**To fix this (one-time setup):**\n\n"
        "1. Get a key at [console.anthropic.com](https://console.anthropic.com/)\n"
        "2. Open `backend/.env` and set `ANTHROPIC_API_KEY=...`\n"
        "3. Restart the backend server\n\n"
        "Then come back here and we'll begin from absolute zero. You've got this! ✨"
    )


def _friendly_error(exc: Exception) -> str:
    name = type(exc).__name__
    if "Authentication" in name:
        return "The Anthropic API key looks invalid. Check ANTHROPIC_API_KEY in backend/.env."
    if "RateLimit" in name:
        return "We're being rate-limited by the API. Wait a moment and try again."
    if "Connection" in name:
        return "Couldn't reach the Anthropic API. Check your internet connection."
    return f"Something went wrong while generating a reply ({name}). Please try again."
