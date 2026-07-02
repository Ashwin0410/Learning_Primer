"""SQLAlchemy models: learning sessions and their messages."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class LearningSession(Base):
    """One learning session for one topic (resumable)."""

    __tablename__ = "learning_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    topic_id: Mapped[str] = mapped_column(String(64), index=True)
    topic_title: Mapped[str] = mapped_column(String(128))

    # Progress tracking.
    section: Mapped[str] = mapped_column(String(32), default="concepts")  # concepts|practice|project|complete
    completed_concepts: Mapped[str] = mapped_column(Text, default="")  # newline-separated concept names
    problems_done: Mapped[int] = mapped_column(Integer, default=0)  # count toward 50
    projects_done: Mapped[int] = mapped_column(Integer, default=0)  # count toward 4-5
    status: Mapped[str] = mapped_column(String(16), default="active")  # active|complete

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    messages: Mapped[list["Message"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="Message.id",
    )

    @property
    def completed_concept_list(self) -> list[str]:
        return [c for c in (self.completed_concepts or "").split("\n") if c]


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("learning_sessions.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(16))  # user | assistant
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    session: Mapped["LearningSession"] = relationship(back_populates="messages")


class DailyLog(Base):
    """One row per active calendar day. Powers both the streak and the journal."""

    __tablename__ = "daily_logs"

    date: Mapped[str] = mapped_column(String(10), primary_key=True)  # YYYY-MM-DD (local)
    chat_turns: Mapped[int] = mapped_column(Integer, default=0)
    topics_touched: Mapped[str] = mapped_column(Text, default="")  # newline-separated titles
    concepts_done: Mapped[int] = mapped_column(Integer, default=0)
    problems_done: Mapped[int] = mapped_column(Integer, default=0)
    projects_done: Mapped[int] = mapped_column(Integer, default=0)
    topics_completed: Mapped[int] = mapped_column(Integer, default=0)
    note: Mapped[str] = mapped_column(Text, default="")  # her journal entry
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    @property
    def topic_list(self) -> list[str]:
        return [t for t in (self.topics_touched or "").split("\n") if t]
