"""
Tiny migration runner — executes backend/migrations/NNN_*.sql in lexical order.

The SQL is idempotent (create ... if not exists, guarded constraints), so
re-running is safe. A `schema_migrations` ledger records applied files for
fast skipping + visibility. Runnable standalone (`python -m migrate`) or from
the FastAPI lifespan.
"""

from __future__ import annotations

import logging
from pathlib import Path

from sqlalchemy import text

from db import connect, wait_for_db

log = logging.getLogger("roadmap.migrate")

MIGRATIONS_DIR = Path(__file__).parent / "migrations"

_LEDGER_DDL = """
create table if not exists schema_migrations (
    filename   text primary key,
    applied_at timestamptz not null default now()
)
"""


def _applied(conn) -> set[str]:
    conn.execute(text(_LEDGER_DDL))
    rows = conn.execute(text("select filename from schema_migrations")).fetchall()
    return {r[0] for r in rows}


def run() -> int:
    """Apply all pending migrations. Returns the count applied this run."""
    if not wait_for_db(timeout_s=30):
        raise RuntimeError("Postgres not reachable; cannot run migrations")

    files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not files:
        log.warning("no migration files found in %s", MIGRATIONS_DIR)
        return 0

    applied_count = 0
    with connect() as conn:
        done = _applied(conn)
        for f in files:
            if f.name in done:
                continue
            sql = f.read_text(encoding="utf-8")
            log.info("applying migration %s", f.name)
            conn.execute(text(sql))
            conn.execute(
                text("insert into schema_migrations (filename) values (:fn) "
                     "on conflict (filename) do nothing"),
                {"fn": f.name},
            )
            applied_count += 1
    log.info("migrations done (%d applied, %d total)", applied_count, len(files))
    return applied_count


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    run()
