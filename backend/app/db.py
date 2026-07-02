"""Database engine, session factory, and FastAPI dependency."""
from __future__ import annotations

from collections.abc import Iterator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import get_settings

settings = get_settings()


def _normalize_db_url(url: str) -> str:
    # Render (and Heroku) hand out `postgres://…`, but SQLAlchemy 2.x needs the
    # `postgresql+psycopg2://…` scheme. Rewrite it so the same code runs on both
    # local SQLite and hosted Postgres unchanged.
    if url.startswith("postgres://"):
        return "postgresql+psycopg2://" + url[len("postgres://") :]
    if url.startswith("postgresql://"):
        return "postgresql+psycopg2://" + url[len("postgresql://") :]
    return url


_db_url = _normalize_db_url(settings.database_url)

# check_same_thread=False is required for SQLite when used with FastAPI's threadpool.
_connect_args = {"check_same_thread": False} if _db_url.startswith("sqlite") else {}

engine = create_engine(_db_url, connect_args=_connect_args, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create tables and apply lightweight migrations for added columns."""
    from . import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _ensure_columns()


def _ensure_columns() -> None:
    """Add columns introduced after a DB was first created (SQLite-friendly).

    create_all() never ALTERs existing tables, so new columns on an old primer.db
    would be missing. This adds them without touching existing data.
    """
    inspector = inspect(engine)
    if "learning_sessions" not in inspector.get_table_names():
        return
    existing = {col["name"] for col in inspector.get_columns("learning_sessions")}
    wanted = {
        "problems_done": "INTEGER NOT NULL DEFAULT 0",
        "projects_done": "INTEGER NOT NULL DEFAULT 0",
    }
    with engine.begin() as conn:
        for name, ddl in wanted.items():
            if name not in existing:
                conn.execute(text(f"ALTER TABLE learning_sessions ADD COLUMN {name} {ddl}"))
