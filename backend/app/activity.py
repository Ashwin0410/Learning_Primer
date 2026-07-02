"""Streak + daily-activity logic. Kept separate from routers for easy testing."""
from __future__ import annotations

from datetime import date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import DailyLog

# Streak milestones that earn a badge.
MILESTONES = [1, 3, 7, 10, 14, 30, 50, 100]


def _to_date(s: str) -> date:
    return datetime.strptime(s, "%Y-%m-%d").date()


def today_str() -> str:
    return date.today().isoformat()


def compute_streak(dates: set[str], today: str) -> dict:
    """Given the set of active-day strings, compute current + longest streak."""
    total = len(dates)

    # Longest consecutive run ever.
    longest = 0
    if dates:
        ordered = sorted(_to_date(d) for d in dates)
        run = 1
        longest = 1
        for prev, cur in zip(ordered, ordered[1:]):
            run = run + 1 if (cur - prev).days == 1 else 1
            longest = max(longest, run)

    # Current streak: consecutive days ending today, or ending yesterday if today
    # isn't active yet (so the streak stays "alive" until the day is missed).
    t = _to_date(today)
    anchor = t if today in dates else (t - timedelta(days=1) if (t - timedelta(days=1)).isoformat() in dates else None)
    current = 0
    if anchor is not None:
        cd = anchor
        while cd.isoformat() in dates:
            current += 1
            cd -= timedelta(days=1)

    return {"current": current, "longest": longest, "total": total, "today_active": today in dates}


def streak_badges(longest: int) -> list[dict]:
    return [{"days": m, "earned": m <= longest} for m in MILESTONES]


def record_activity(
    db: Session,
    *,
    topic_title: str,
    concepts: int,
    problems: int,
    projects: int,
    completed_topic: bool,
) -> list[int]:
    """Log today's activity/progress and return any newly-earned streak milestones."""
    today = today_str()
    existing = set(db.scalars(select(DailyLog.date)).all())
    first_today = today not in existing

    row = db.get(DailyLog, today)
    if row is None:
        row = DailyLog(date=today)
        db.add(row)
    row.chat_turns = (row.chat_turns or 0) + 1
    if topic_title:
        topics = row.topic_list
        if topic_title not in topics:
            topics.append(topic_title)
            row.topics_touched = "\n".join(topics)
    row.concepts_done = (row.concepts_done or 0) + concepts
    row.problems_done = (row.problems_done or 0) + problems
    row.projects_done = (row.projects_done or 0) + projects
    if completed_topic:
        row.topics_completed = (row.topics_completed or 0) + 1
    db.commit()

    if not first_today:
        return []  # streak only changes on the day's first activity
    before = compute_streak(existing, today)["longest"]
    after = compute_streak(existing | {today}, today)["longest"]
    return [m for m in MILESTONES if before < m <= after]


def pretty_date(date_str: str) -> str:
    dt = _to_date(date_str)
    label = f"{dt:%A, %B} {dt.day}"
    if dt.year != date.today().year:
        label += f", {dt.year}"
    return label
