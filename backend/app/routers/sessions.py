"""Learning session endpoints: create/resume, list, fetch, delete."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import curriculum as cur
from ..db import get_db
from ..models import LearningSession
from ..schemas import CreateSessionRequest, MessageOut, SessionDetail, SessionSummary
from .auth import require_auth

router = APIRouter(prefix="/sessions", tags=["sessions"], dependencies=[Depends(require_auth)])


def _summary(s: LearningSession) -> SessionSummary:
    topic = cur.get_topic(s.topic_id)
    total = len(topic["concepts"]) if topic else 0
    return SessionSummary(
        id=s.id,
        topic_id=s.topic_id,
        topic_title=s.topic_title,
        topic_icon=topic["icon"] if topic else "🌱",
        section=s.section,
        status=s.status,
        completed_concepts=s.completed_concept_list,
        concept_total=total,
        problems_done=s.problems_done,
        problems_target=cur.PROBLEMS_TARGET,
        projects_done=s.projects_done,
        projects_target=cur.PROJECTS_TARGET,
        created_at=s.created_at,
        updated_at=s.updated_at,
    )


def _detail(s: LearningSession) -> SessionDetail:
    base = _summary(s)
    return SessionDetail(
        **base.model_dump(),
        messages=[MessageOut.model_validate(m) for m in s.messages],
    )


@router.get("", response_model=list[SessionSummary])
def list_sessions(db: Session = Depends(get_db)) -> list[SessionSummary]:
    rows = db.scalars(select(LearningSession).order_by(LearningSession.updated_at.desc())).all()
    return [_summary(s) for s in rows]


@router.post("", response_model=SessionDetail)
def create_or_resume(body: CreateSessionRequest, db: Session = Depends(get_db)) -> SessionDetail:
    topic = cur.get_topic(body.topic_id)
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")

    # Resume the most recent still-active session for this topic, if any.
    existing = db.scalars(
        select(LearningSession)
        .where(LearningSession.topic_id == body.topic_id, LearningSession.status == "active")
        .order_by(LearningSession.updated_at.desc())
    ).first()
    if existing is not None:
        return _detail(existing)

    session = LearningSession(topic_id=topic["id"], topic_title=topic["title"])
    db.add(session)
    db.commit()
    db.refresh(session)
    return _detail(session)


@router.get("/{session_id}", response_model=SessionDetail)
def get_session(session_id: int, db: Session = Depends(get_db)) -> SessionDetail:
    session = db.get(LearningSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return _detail(session)


@router.post("/{session_id}/reset", response_model=SessionDetail)
def reset_session(session_id: int, db: Session = Depends(get_db)) -> SessionDetail:
    """Wipe a session's lesson + progress so the topic starts fresh from Part 1."""
    session = db.get(LearningSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    for m in list(session.messages):
        db.delete(m)
    session.completed_concepts = ""
    session.problems_done = 0
    session.projects_done = 0
    session.section = "concepts"
    session.status = "active"
    db.commit()
    db.refresh(session)
    return _detail(session)


@router.delete("/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)) -> dict:
    session = db.get(LearningSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"ok": True}
