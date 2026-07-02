"""Curriculum endpoints: the roadmap and per-topic detail."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from .. import curriculum as cur
from ..config import get_settings
from .auth import require_auth

router = APIRouter(prefix="/curriculum", tags=["curriculum"], dependencies=[Depends(require_auth)])
settings = get_settings()


@router.get("")
def get_curriculum() -> dict:
    return {
        "learner_name": settings.learner_name,
        "total_topics": cur.TOTAL_TOPICS,
        "phases": cur.phases_with_topics(),
    }


@router.get("/topics/{topic_id}")
def get_topic(topic_id: str) -> dict:
    topic = cur.get_topic(topic_id)
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    phase = next((p for p in cur.PHASES if p["id"] == topic["phase"]), None)
    return {**topic, "phase_title": phase["title"] if phase else "", "phase_accent": phase["accent"] if phase else "#6366f1"}
