"""
Notifications — a lightweight per-user feed built on top of the activity log.

Any signed-in user sees recent team activity on projects, tools, and divisions
(everyone's actions except their own), newest first. The unread count is tracked
by a per-user `notifications_seen_at` watermark on the users table: opening the
bell stamps "seen" = now(), so the badge clears. No separate notifications table.
"""

from __future__ import annotations

from fastapi import APIRouter, Request
from sqlalchemy import text

import auth
from db import connect

router = APIRouter(tags=["notifications"])

# Only surface team-relevant changes in the bell — project/tool/division edits.
# (Phases, versions, docs, logins, reorders, and user-management stay out of it.)
_FEED_WHERE = (
    "a.actor_email is distinct from :me "
    "and a.action in ('created','updated','deleted','status_change','priority','note') "
    "and a.entity_type in ('feature','roadmap_item','system','division')"
)


@router.get("/notifications")
def list_notifications(request: Request, limit: int = 30):
    user = auth.require_user(request)
    limit = max(1, min(limit, 50))
    me = user["email"]
    with connect() as conn:
        seen = conn.execute(
            text("select notifications_seen_at from users where id = :id"),
            {"id": user["id"]},
        ).scalar()
        rows = conn.execute(
            text(
                "select a.id, a.actor_email, a.action, a.entity_type, a.entity_id, "
                "a.detail, a.created_at, coalesce(ri.title, sys.name) as title "
                "from activity a "
                "left join roadmap_items ri "
                "  on a.entity_type in ('feature','roadmap_item') and ri.id::text = a.entity_id "
                "left join systems sys "
                "  on a.entity_type in ('system','division') and sys.id::text = a.entity_id "
                f"where {_FEED_WHERE} "
                "order by a.created_at desc limit :lim"
            ),
            {"me": me, "lim": limit},
        ).mappings().all()
        unread = conn.execute(
            text(
                f"select count(*) from activity a where {_FEED_WHERE} "
                # Cast the bound param so a NULL watermark has a known type
                # (Postgres can't infer the type of a bare NULL parameter).
                "and (cast(:seen as timestamptz) is null or a.created_at > cast(:seen as timestamptz))"
            ),
            {"me": me, "seen": seen},
        ).scalar()
    items = []
    for r in rows:
        d = dict(r)
        d["id"] = str(d["id"])
        created = d.get("created_at")
        d["unread"] = seen is None or (created is not None and created > seen)
        d["created_at"] = created.isoformat() if created else None
        items.append(d)
    return {
        "items": items,
        "unread_count": int(unread or 0),
        "seen_at": seen.isoformat() if seen else None,
    }


@router.post("/notifications/seen")
def mark_seen(request: Request):
    """Stamp the read watermark to now() for the current user — clears the badge."""
    user = auth.require_user(request)
    with connect() as conn:
        conn.execute(
            text("update users set notifications_seen_at = now() where id = :id"),
            {"id": user["id"]},
        )
    return {"ok": True}
