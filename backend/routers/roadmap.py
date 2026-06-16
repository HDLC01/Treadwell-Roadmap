"""
Roadmap router — phases (epoxy layers) + roadmap_items (tasks) CRUD, reorder,
status change, and the per-task division tag. All writes require admin.
"""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Request
from pydantic import BaseModel
from sqlalchemy import text

import auth
from db import connect
from store import log_activity, set_ordering

router = APIRouter(tags=["roadmap"])

_LAYERS = {"grind", "repair", "clean", "primer", "basecoat", "topcoat", "cure"}
_STATUS = {"live", "in_progress", "planned", "not_started"}


# ─── phases ────────────────────────────────────────────────────────────────
class PhaseCreate(BaseModel):
    layer_type: str
    title: str
    phase_label: Optional[str] = None
    detail: Optional[str] = None
    status: str = "planned"


class PhaseUpdate(BaseModel):
    layer_type: Optional[str] = None
    title: Optional[str] = None
    phase_label: Optional[str] = None
    detail: Optional[str] = None
    status: Optional[str] = None
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None


class ReorderBody(BaseModel):
    ids: List[str]


@router.post("/systems/{system_id}/phases")
def create_phase(request: Request, system_id: str, body: PhaseCreate):
    user = auth.require_admin(request)
    if body.layer_type not in _LAYERS or body.status not in _STATUS:
        raise auth.AuthError(400, "Invalid layer_type or status")
    with connect() as conn:
        nxt = conn.execute(
            text("select coalesce(max(ordering), -1) + 1 from phases where system_id = :s"),
            {"s": system_id},
        ).scalar()
        row = conn.execute(
            text("insert into phases (system_id, layer_type, title, phase_label, detail, status, ordering) "
                 "values (:s, :lt, :t, :pl, :d, :st, :o) returning id"),
            {"s": system_id, "lt": body.layer_type, "t": body.title, "pl": body.phase_label,
             "d": body.detail, "st": body.status, "o": nxt},
        ).mappings().first()
        log_activity(conn, user["email"], "created", "phase", row["id"], {"system_id": system_id})
    return {"id": str(row["id"])}


@router.patch("/phases/{phase_id}")
def update_phase(request: Request, phase_id: str, body: PhaseUpdate):
    user = auth.require_admin(request)
    fields = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
    if "layer_type" in fields and fields["layer_type"] not in _LAYERS:
        raise auth.AuthError(400, "Invalid layer_type")
    if "status" in fields and fields["status"] not in _STATUS:
        raise auth.AuthError(400, "Invalid status")
    if not fields:
        return {"ok": True}
    sets = ", ".join(f"{k} = :{k}" for k in fields)
    fields["id"] = phase_id
    with connect() as conn:
        conn.execute(text(f"update phases set {sets} where id = :id"), fields)
        log_activity(conn, user["email"], "updated", "phase", phase_id, {"fields": list(fields)})
    return {"ok": True}


@router.post("/systems/{system_id}/phases/reorder")
def reorder_phases(request: Request, system_id: str, body: ReorderBody):
    auth.require_admin(request)
    with connect() as conn:
        set_ordering(conn, "phases", body.ids)
    return {"ok": True}


@router.delete("/phases/{phase_id}")
def delete_phase(request: Request, phase_id: str):
    user = auth.require_admin(request)
    with connect() as conn:
        conn.execute(text("delete from phases where id = :id"), {"id": phase_id})
        log_activity(conn, user["email"], "deleted", "phase", phase_id)
    return {"ok": True}


# ─── items ─────────────────────────────────────────────────────────────────
class ItemCreate(BaseModel):
    title: str
    detail: Optional[str] = None
    status: str = "planned"
    is_feature: bool = False
    division_id: Optional[str] = None


class ItemUpdate(BaseModel):
    title: Optional[str] = None
    detail: Optional[str] = None
    is_feature: Optional[bool] = None
    division_id: Optional[str] = None


class StatusBody(BaseModel):
    status: str


@router.post("/phases/{phase_id}/items")
def create_item(request: Request, phase_id: str, body: ItemCreate):
    user = auth.require_admin(request)
    if body.status not in _STATUS:
        raise auth.AuthError(400, "Invalid status")
    with connect() as conn:
        nxt = conn.execute(
            text("select coalesce(max(ordering), -1) + 1 from roadmap_items where phase_id = :p"),
            {"p": phase_id},
        ).scalar()
        row = conn.execute(
            text("insert into roadmap_items (phase_id, division_id, title, detail, status, is_feature, ordering) "
                 "values (:p, :div, :t, :d, :st, :f, :o) returning id"),
            {"p": phase_id, "div": body.division_id, "t": body.title, "d": body.detail,
             "st": body.status, "f": body.is_feature, "o": nxt},
        ).mappings().first()
        log_activity(conn, user["email"], "created", "roadmap_item", row["id"], {"phase_id": phase_id})
    return {"id": str(row["id"])}


class FeatureCreate(BaseModel):
    title: str
    detail: Optional[str] = None
    status: str = "not_started"
    division_id: Optional[str] = None


@router.post("/systems/{system_id}/features")
def create_feature(request: Request, system_id: str, body: FeatureCreate):
    """Create a feature node on the project's feature board (attached to the system,
    no phase). is_feature is always true here."""
    user = auth.require_admin(request)
    if body.status not in _STATUS:
        raise auth.AuthError(400, "Invalid status")
    with connect() as conn:
        nxt = conn.execute(
            text("select coalesce(max(ordering), -1) + 1 from roadmap_items where system_id = :s"),
            {"s": system_id},
        ).scalar()
        row = conn.execute(
            text("insert into roadmap_items (system_id, phase_id, division_id, title, detail, status, is_feature, ordering) "
                 "values (:s, null, :div, :t, :d, :st, true, :o) returning id"),
            {"s": system_id, "div": body.division_id, "t": body.title, "d": body.detail,
             "st": body.status, "o": nxt},
        ).mappings().first()
        log_activity(conn, user["email"], "created", "feature", row["id"], {"system_id": system_id})
    return {"id": str(row["id"])}


@router.patch("/items/{item_id}")
def update_item(request: Request, item_id: str, body: ItemUpdate):
    user = auth.require_admin(request)
    fields = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
    if not fields:
        return {"ok": True}
    sets = ", ".join(f"{k} = :{k}" for k in fields)
    fields["id"] = item_id
    with connect() as conn:
        conn.execute(text(f"update roadmap_items set {sets} where id = :id"), fields)
        log_activity(conn, user["email"], "updated", "roadmap_item", item_id, {"fields": list(fields)})
    return {"ok": True}


@router.patch("/items/{item_id}/status")
def set_item_status(request: Request, item_id: str, body: StatusBody):
    user = auth.require_admin(request)
    if body.status not in _STATUS:
        raise auth.AuthError(400, "Invalid status")
    with connect() as conn:
        conn.execute(text("update roadmap_items set status = :st where id = :id"),
                     {"st": body.status, "id": item_id})
        log_activity(conn, user["email"], "status_change", "roadmap_item", item_id, {"status": body.status})
    return {"ok": True}


@router.post("/phases/{phase_id}/items/reorder")
def reorder_items(request: Request, phase_id: str, body: ReorderBody):
    auth.require_admin(request)
    with connect() as conn:
        set_ordering(conn, "roadmap_items", body.ids)
    return {"ok": True}


@router.delete("/items/{item_id}")
def delete_item(request: Request, item_id: str):
    user = auth.require_admin(request)
    with connect() as conn:
        conn.execute(text("delete from roadmap_items where id = :id"), {"id": item_id})
        log_activity(conn, user["email"], "deleted", "roadmap_item", item_id)
    return {"ok": True}
