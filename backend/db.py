"""
Database access — a single lazily-created SQLAlchemy 2.0 Engine over psycopg 3.

Lazy so the app can import/start even if Postgres is briefly unreachable
(the /api/health endpoint stays green; the first real query raises clearly).
`pool_pre_ping=True` transparently recovers from a Postgres restart.
"""

from __future__ import annotations

import logging
import time
from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from config import settings

log = logging.getLogger("roadmap.db")

_engine: Engine | None = None


def get_engine() -> Engine:
    """Return the process-wide Engine, creating it on first use."""
    global _engine
    if _engine is None:
        _engine = create_engine(
            settings.DATABASE_URL,
            pool_size=5,
            max_overflow=5,
            pool_pre_ping=True,
            future=True,
        )
    return _engine


@contextmanager
def connect() -> Iterator:
    """A transactional connection (commits on success, rolls back on error)."""
    eng = get_engine()
    with eng.begin() as conn:
        yield conn


def ping() -> bool:
    """True if the DB answers SELECT 1. Never raises (used by /api/health)."""
    try:
        with get_engine().connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as exc:  # noqa: BLE001
        log.debug("db ping failed: %s", exc)
        return False


def wait_for_db(timeout_s: int = 30, interval_s: float = 1.0) -> bool:
    """Block until Postgres accepts a SELECT 1, up to timeout. Returns success."""
    deadline = time.monotonic() + timeout_s
    attempt = 0
    while time.monotonic() < deadline:
        attempt += 1
        if ping():
            if attempt > 1:
                log.info("database ready after %d attempt(s)", attempt)
            return True
        time.sleep(interval_s)
    log.warning("database not ready after %ss", timeout_s)
    return False
