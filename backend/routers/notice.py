"""
Site notice bar — a single admin-editable announcement shown across the top of
every page (for updates). GET is open to any signed-in user; PUT requires admin.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Request
from pydantic import BaseModel
from sqlalchemy import text

import auth
from db import connect

router = APIRouter(tags=["notice"])

_LEVELS = {"info", "update", "warning"}


class NoticeBody(BaseModel):
    message: str = ""
    level: str = "info"
    active: bool = False


def _serialize(row) -> dict:
    if not row:
        return {"message": "", "level": "info", "active": False, "updated_by": None, "updated_at": None}
    d = dict(row)
    d["updated_at"] = d["updated_at"].isoformat() if d.get("updated_at") else None
    return d


@router.get("/notice")
def get_notice(request: Request):
    auth.require_user(request)
    with connect() as conn:
        row = conn.execute(
            text("select message, level, active, updated_by, updated_at from site_notice where id = 1")
        ).mappings().first()
    return _serialize(row)


@router.put("/notice")
def set_notice(request: Request, body: NoticeBody):
    user = auth.require_admin(request)
    level = body.level if body.level in _LEVELS else "info"
    with connect() as conn:
        conn.execute(
            text(
                "insert into site_notice (id, message, level, active, updated_by, updated_at) "
                "values (1, :m, :l, :a, :by, now()) "
                "on conflict (id) do update set message = :m, level = :l, active = :a, "
                "updated_by = :by, updated_at = now()"
            ),
            {"m": body.message, "l": level, "a": body.active, "by": user["email"]},
        )
    return {"ok": True}
