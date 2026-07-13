"""
Project notes — a per-project thread of questions, clarifications, and asks that
hangs on EITHER a feature card (item) OR a Live tool (system). Everyone signed in
can READ the thread.

Two kinds of note:
  • FLAG  — raised by an ADMIN (Hanz). Turns the project red and floats it to the
            top. Only an admin resolves or deletes it (clears the flag).
  • REPLY — added by any EDITOR (member). A teammate answering back on the
            suggestion. Does NOT flag the project; only an admin can remove it.

Which kind a new note becomes is decided by the author's role at creation
(admin → flag, member → reply). Flag counts (open_notes) are computed in floors.py
and drive the red flag + sort-to-top on the board. Adding a note logs an activity
so it also surfaces in the notification bell.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Request
from pydantic import BaseModel
from sqlalchemy import text

import auth
from db import connect
from store import log_activity

router = APIRouter(tags=["notes"])


class NoteCreate(BaseModel):
    body: str


class NoteUpdate(BaseModel):
    resolved: Optional[bool] = None


def _row(m) -> dict:
    d = dict(m)
    d["id"] = str(d["id"])
    d["created_at"] = d["created_at"].isoformat() if d.get("created_at") else None
    return d


def _list_notes(col: str, val: str) -> dict:
    with connect() as conn:
        rows = conn.execute(
            text(f"select id, author_email, body, resolved, is_flag, created_at "
                 f"from project_notes where {col} = :v order by created_at"),
            {"v": val},
        ).mappings().all()
    return {"notes": [_row(r) for r in rows]}


def _add_note(col: str, val: str, entity_type: str, user: dict, body: NoteCreate) -> dict:
    text_body = (body.body or "").strip()
    if not text_body:
        raise auth.AuthError(400, "Note can't be empty")
    # Only an admin raises a flag; a member's note is a plain reply.
    is_flag = user.get("role") == "admin"
    with connect() as conn:
        row = conn.execute(
            text(f"insert into project_notes ({col}, author_email, body, is_flag) "
                 f"values (:v, :a, :b, :f) returning id"),
            {"v": val, "a": user["email"], "b": text_body, "f": is_flag},
        ).mappings().first()
        log_activity(conn, user["email"], "note", entity_type, val,
                     {"body_preview": text_body[:80], "is_flag": is_flag})
    return {"id": str(row["id"])}


# ── feature-card (roadmap_item) notes ──
@router.get("/items/{item_id}/notes")
def list_notes(request: Request, item_id: str):
    auth.require_user(request)
    return _list_notes("item_id", item_id)


@router.post("/items/{item_id}/notes")
def add_note(request: Request, item_id: str, body: NoteCreate):
    # Any editor (member or admin) may post; role decides flag vs reply. Viewers 403.
    user = auth.require_editor(request)
    return _add_note("item_id", item_id, "roadmap_item", user, body)


# ── Live-tool (system) notes — same thread, so tools can be flagged too ──
@router.get("/systems/{system_id}/notes")
def list_system_notes(request: Request, system_id: str):
    auth.require_user(request)
    return _list_notes("system_id", system_id)


@router.post("/systems/{system_id}/notes")
def add_system_note(request: Request, system_id: str, body: NoteCreate):
    user = auth.require_editor(request)
    return _add_note("system_id", system_id, "system", user, body)


# ── resolve / delete: ADMIN only, whatever the note hangs on (clears the flag) ──
@router.patch("/notes/{note_id}")
def update_note(request: Request, note_id: str, body: NoteUpdate):
    user = auth.require_admin(request)
    if body.resolved is None:
        return {"ok": True}
    with connect() as conn:
        r = conn.execute(
            text("update project_notes set resolved = :r where id = :id "
                 "returning item_id, system_id"),
            {"r": body.resolved, "id": note_id},
        ).mappings().first()
        if r:
            entity_type = "roadmap_item" if r["item_id"] else "system"
            entity_id = str(r["item_id"] or r["system_id"])
            log_activity(conn, user["email"], "note_resolved", entity_type,
                         entity_id, {"resolved": body.resolved})
    return {"ok": True}


@router.delete("/notes/{note_id}")
def delete_note(request: Request, note_id: str):
    user = auth.require_admin(request)
    with connect() as conn:
        r = conn.execute(
            text("delete from project_notes where id = :id "
                 "returning item_id, system_id"),
            {"id": note_id},
        ).mappings().first()
        if r:
            entity_type = "roadmap_item" if r["item_id"] else "system"
            entity_id = str(r["item_id"] or r["system_id"])
            log_activity(conn, user["email"], "deleted", "project_note", entity_id,
                         {"of": entity_type})
    return {"ok": True}
