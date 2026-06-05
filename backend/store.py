"""Small shared DB helpers for the routers (activity log + reorder)."""

from __future__ import annotations

import json
from typing import Iterable

from sqlalchemy import text


def log_activity(conn, actor_email, action, entity_type, entity_id, detail=None):
    conn.execute(
        text("insert into activity (actor_email, action, entity_type, entity_id, detail) "
             "values (:a, :ac, :et, :eid, cast(:d as jsonb))"),
        {"a": actor_email, "ac": action, "et": entity_type,
         "eid": str(entity_id) if entity_id is not None else None,
         "d": json.dumps(detail or {})},
    )


def set_ordering(conn, table: str, ids: Iterable[str]) -> None:
    """Rewrite `ordering` = position for the given ids (single transaction).
    `table` is a trusted constant from the router, never user input."""
    for idx, _id in enumerate(ids):
        conn.execute(
            text(f"update {table} set ordering = :o where id = :id"),
            {"o": idx, "id": _id},
        )
