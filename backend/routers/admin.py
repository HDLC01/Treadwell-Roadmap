"""Admin router — user management + activity log (admin only)."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Request
from pydantic import BaseModel
from sqlalchemy import text

import auth
from db import connect
from store import log_activity

router = APIRouter(prefix="/admin", tags=["admin"])

_ROLES = {"admin", "viewer"}
_STATUSES = {"active", "disabled"}


class UserCreate(BaseModel):
    # Invite by email + role. Identity is Google/Supabase; no password here.
    email: str
    full_name: Optional[str] = None
    role: str = "viewer"


class UserUpdate(BaseModel):
    role: Optional[str] = None
    status: Optional[str] = None


def _row(m) -> dict:
    d = dict(m)
    d["id"] = str(d["id"])
    return d


@router.get("/users")
def list_users(request: Request):
    auth.require_admin(request)
    with connect() as conn:
        rows = conn.execute(
            text("select id, email, full_name, role, status, last_login_at, created_at "
                 "from users order by created_at")
        ).mappings().all()
    return {"users": [_row(r) for r in rows]}


@router.post("/users")
def create_user(request: Request, body: UserCreate):
    actor = auth.require_admin(request)
    if body.role not in _ROLES:
        raise auth.AuthError(400, "Invalid role")
    with connect() as conn:
        exists = conn.execute(text("select 1 from users where email = :e"),
                              {"e": body.email}).first()
        if exists:
            raise auth.AuthError(409, "A user with that email already exists")
        row = conn.execute(
            text("insert into users (email, full_name, role, status) "
                 "values (:e, :n, :r, 'active') returning id"),
            {"e": body.email.strip().lower(), "n": body.full_name, "r": body.role},
        ).mappings().first()
        log_activity(conn, actor["email"], "created", "user", row["id"], {"email": body.email})
    return {"id": str(row["id"])}


@router.patch("/users/{user_id}")
def update_user(request: Request, user_id: str, body: UserUpdate):
    actor = auth.require_admin(request)
    with connect() as conn:
        target = conn.execute(
            text("select id, email, role, status from users where id = :id"),
            {"id": user_id},
        ).mappings().first()
        if not target:
            raise auth.AuthError(404, "User not found")
        # Anti-lockout: can't disable/demote self or a configured admin.
        sensitive = ("status" in body.model_dump(exclude_unset=True)
                     or "role" in body.model_dump(exclude_unset=True))
        if sensitive:
            ok, why = auth.can_modify_account({"id": actor["id"]}, dict(target))
            if not ok:
                raise auth.AuthError(403, why)
        fields = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
        if "role" in fields and fields["role"] not in _ROLES:
            raise auth.AuthError(400, "Invalid role")
        if "status" in fields and fields["status"] not in _STATUSES:
            raise auth.AuthError(400, "Invalid status")
        if not fields:
            return {"ok": True}
        sets = ", ".join(f"{k} = :{k}" for k in fields)
        fields["id"] = user_id
        conn.execute(text(f"update users set {sets} where id = :id"), fields)
        log_activity(conn, actor["email"], "updated", "user", user_id, {"fields": list(fields)})
    return {"ok": True}


@router.delete("/users/{user_id}")
def delete_user(request: Request, user_id: str):
    actor = auth.require_admin(request)
    with connect() as conn:
        target = conn.execute(
            text("select id, email from users where id = :id"), {"id": user_id}
        ).mappings().first()
        if not target:
            raise auth.AuthError(404, "User not found")
        ok, why = auth.can_modify_account({"id": actor["id"]}, dict(target))
        if not ok:
            raise auth.AuthError(403, why)
        conn.execute(text("delete from users where id = :id"), {"id": user_id})
        log_activity(conn, actor["email"], "deleted", "user", user_id, {"email": target["email"]})
    return {"ok": True}


@router.get("/activity")
def list_activity(request: Request, limit: int = 50):
    auth.require_admin(request)
    limit = max(1, min(limit, 200))
    with connect() as conn:
        rows = conn.execute(
            text("select id, actor_email, action, entity_type, entity_id, detail, created_at "
                 "from activity order by created_at desc limit :l"),
            {"l": limit},
        ).mappings().all()
    return {"activity": [dict(r) for r in rows]}
