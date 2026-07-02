"""Pydantic request/response schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class LoginRequest(BaseModel):
    passcode: str


class LoginResponse(BaseModel):
    ok: bool
    learner_name: str
    token: str


class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionSummary(BaseModel):
    id: int
    topic_id: str
    topic_title: str
    topic_icon: str = ""
    section: str
    status: str
    completed_concepts: list[str]
    concept_total: int
    problems_done: int
    problems_target: int
    projects_done: int
    projects_target: int
    created_at: datetime
    updated_at: datetime


class SessionDetail(SessionSummary):
    messages: list[MessageOut]


class CreateSessionRequest(BaseModel):
    topic_id: str


class ChatRequest(BaseModel):
    session_id: int
    message: str


class StreakBadge(BaseModel):
    days: int
    earned: bool


class StreakOut(BaseModel):
    current: int
    longest: int
    total: int
    today_active: bool
    badges: list[StreakBadge]


class JournalEntry(BaseModel):
    date: str
    pretty_date: str
    chat_turns: int
    topics: list[str]
    concepts: int
    problems: int
    projects: int
    topics_completed: int
    note: str


class JournalNoteUpdate(BaseModel):
    note: str
