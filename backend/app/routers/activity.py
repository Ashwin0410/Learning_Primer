"""Streak + journal endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import activity
from ..db import get_db
from ..models import DailyLog
from ..schemas import JournalEntry, JournalNoteUpdate, StreakOut
from .auth import require_auth

router = APIRouter(tags=["activity"], dependencies=[Depends(require_auth)])


@router.get("/streak", response_model=StreakOut)
def get_streak(db: Session = Depends(get_db)) -> StreakOut:
    dates = set(db.scalars(select(DailyLog.date)).all())
    s = activity.compute_streak(dates, activity.today_str())
    return StreakOut(**s, badges=activity.streak_badges(s["longest"]))


@router.get("/journal", response_model=list[JournalEntry])
def get_journal(db: Session = Depends(get_db)) -> list[JournalEntry]:
    rows = db.scalars(select(DailyLog).order_by(DailyLog.date.desc())).all()
    return [
        JournalEntry(
            date=r.date,
            pretty_date=activity.pretty_date(r.date),
            chat_turns=r.chat_turns,
            topics=r.topic_list,
            concepts=r.concepts_done,
            problems=r.problems_done,
            projects=r.projects_done,
            topics_completed=r.topics_completed,
            note=r.note or "",
        )
        for r in rows
    ]


@router.put("/journal/{entry_date}", response_model=JournalEntry)
def save_note(entry_date: str, body: JournalNoteUpdate, db: Session = Depends(get_db)) -> JournalEntry:
    row = db.get(DailyLog, entry_date)
    if row is None:
        # Allow a note on a day with no auto-activity (e.g. a reflection-only day).
        row = DailyLog(date=entry_date)
        db.add(row)
    row.note = body.note
    db.commit()
    db.refresh(row)
    return JournalEntry(
        date=row.date,
        pretty_date=activity.pretty_date(row.date),
        chat_turns=row.chat_turns,
        topics=row.topic_list,
        concepts=row.concepts_done,
        problems=row.problems_done,
        projects=row.projects_done,
        topics_completed=row.topics_completed,
        note=row.note or "",
    )
