"""
Project notes — a per-project thread of notes from Hanz (questions, clarifications,
asks). Everyone signed in can READ the thread; only an admin (Hanz is the sole
admin) can add / resolve / delete. A project with >=1 unresolved note flags red and
floats to the top of its division list (count computed in floors.py; rendered in the
frontend). Adding a note logs an activity so it also surfaces in the notification bell.
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


@router.get("/items/{item_id}/notes")
def list_notes(request: Request, item_id: str):
    auth.require_user(request)
    with connect() as conn:
        rows = conn.execute(
            text("select id, author_email, body, resolved, created_at "
                 "from project_notes where item_id = :i order by created_at"),
            {"i": item_id},
        ).mappings().all()
    return {"notes": [_row(r) for r in rows]}


@router.post("/items/{item_id}/notes")
def add_note(request: Request, item_id: str, body: NoteCreate):
    user = auth.require_admin(request)
    text_body = (body.body or "").strip()
    if not text_body:
        raise auth.AuthError(400, "Note can't be empty")
    with connect() as conn:
        row = conn.execute(
            text("insert into project_notes (item_id, author_email, body) "
                 "values (:i, :a, :b) returning id"),
            {"i": item_id, "a": user["email"], "b": text_body},
        ).mappings().first()
        log_activity(conn, user["email"], "note", "roadmap_item", item_id,
                     {"body_preview": text_body[:80]})
    return {"id": str(row["id"])}


@router.patch("/notes/{note_id}")
def update_note(request: Request, note_id: str, body: NoteUpdate):
    user = auth.require_admin(request)
    if body.resolved is None:
        return {"ok": True}
    with connect() as conn:
        r = conn.execute(
            text("update project_notes set resolved = :r where id = :id returning item_id"),
            {"r": body.resolved, "id": note_id},
        ).mappings().first()
        if r:
            log_activity(conn, user["email"], "note_resolved", "roadmap_item",
                         str(r["item_id"]), {"resolved": body.resolved})
    return {"ok": True}


@router.delete("/notes/{note_id}")
def delete_note(request: Request, note_id: str):
    user = auth.require_admin(request)
    with connect() as conn:
        r = conn.execute(
            text("delete from project_notes where id = :id returning item_id"),
            {"id": note_id},
        ).mappings().first()
        if r:
            log_activity(conn, user["email"], "deleted", "project_note", str(r["item_id"]))
    return {"ok": True}
