"""Docs router — SOP + developer-doc pages (markdown), CRUD + reorder."""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Request
from pydantic import BaseModel
from sqlalchemy import text

import auth
from db import connect
from store import log_activity, set_ordering

router = APIRouter(tags=["docs"])

_KINDS = {"sop", "dev_doc"}


class DocCreate(BaseModel):
    kind: str
    slug: str
    title: str
    section: Optional[str] = None
    body_markdown: str = ""


class DocUpdate(BaseModel):
    title: Optional[str] = None
    section: Optional[str] = None
    body_markdown: Optional[str] = None


class ReorderBody(BaseModel):
    ids: List[str]


def _row(m) -> dict:
    d = dict(m)
    for k in ("id", "system_id", "updated_by"):
        if k in d and d[k] is not None:
            d[k] = str(d[k])
    return d


@router.get("/systems/{system_id}/docs")
def list_docs(request: Request, system_id: str, kind: Optional[str] = None):
    auth.require_user(request)
    sql = ("select id, kind, section, slug, title, ordering, updated_at "
           "from doc_pages where system_id = :s {kf} order by kind, ordering, title")
    params = {"s": system_id}
    kf = ""
    if kind:
        kf = "and kind = :k"
        params["k"] = kind
    with connect() as conn:
        rows = conn.execute(text(sql.format(kf=kf)), params).mappings().all()
    return {"docs": [_row(r) for r in rows]}


@router.get("/docs/{doc_id}")
def get_doc(request: Request, doc_id: str):
    auth.require_user(request)
    with connect() as conn:
        row = conn.execute(
            text("select id, system_id, kind, section, slug, title, body_markdown, ordering, updated_at "
                 "from doc_pages where id = :id"),
            {"id": doc_id},
        ).mappings().first()
    if not row:
        raise auth.AuthError(404, "Doc not found")
    return _row(row)


@router.post("/systems/{system_id}/docs")
def create_doc(request: Request, system_id: str, body: DocCreate):
    user = auth.require_admin(request)
    if body.kind not in _KINDS:
        raise auth.AuthError(400, "Invalid kind")
    with connect() as conn:
        nxt = conn.execute(
            text("select coalesce(max(ordering), -1) + 1 from doc_pages where system_id = :s and kind = :k"),
            {"s": system_id, "k": body.kind},
        ).scalar()
        row = conn.execute(
            text("insert into doc_pages (system_id, kind, section, slug, title, body_markdown, ordering, updated_by) "
                 "values (:s, :k, :sec, :slug, :t, :b, :o, :u) returning id"),
            {"s": system_id, "k": body.kind, "sec": body.section, "slug": body.slug,
             "t": body.title, "b": body.body_markdown, "o": nxt, "u": user["id"]},
        ).mappings().first()
        log_activity(conn, user["email"], "created", "doc_page", row["id"], {"system_id": system_id})
    return {"id": str(row["id"])}


@router.patch("/docs/{doc_id}")
def update_doc(request: Request, doc_id: str, body: DocUpdate):
    user = auth.require_admin(request)
    fields = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
    if not fields:
        return {"ok": True}
    fields["updated_by"] = user["id"]
    sets = ", ".join(f"{k} = :{k}" for k in fields)
    fields["id"] = doc_id
    with connect() as conn:
        conn.execute(text(f"update doc_pages set {sets} where id = :id"), fields)
        log_activity(conn, user["email"], "updated", "doc_page", doc_id, {"fields": list(fields)})
    return {"ok": True}


@router.post("/systems/{system_id}/docs/reorder")
def reorder_docs(request: Request, system_id: str, body: ReorderBody):
    auth.require_admin(request)
    with connect() as conn:
        set_ordering(conn, "doc_pages", body.ids)
    return {"ok": True}


@router.delete("/docs/{doc_id}")
def delete_doc(request: Request, doc_id: str):
    user = auth.require_admin(request)
    with connect() as conn:
        conn.execute(text("delete from doc_pages where id = :id"), {"id": doc_id})
        log_activity(conn, user["email"], "deleted", "doc_page", doc_id)
    return {"ok": True}
