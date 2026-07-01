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
    version_id: Optional[str] = None
    target_date: Optional[str] = None  # "YYYY-MM-DD" to set, null to clear


class StatusBody(BaseModel):
    status: str


class PriorityBody(BaseModel):
    priority: bool


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
            text("insert into roadmap_items (phase_id, division_id, title, detail, status, is_feature, ordering, created_by) "
                 "values (:p, :div, :t, :d, :st, :f, :o, :by) returning id"),
            {"p": phase_id, "div": body.division_id, "t": body.title, "d": body.detail,
             "st": body.status, "f": body.is_feature, "o": nxt, "by": user["email"]},
        ).mappings().first()
        log_activity(conn, user["email"], "created", "roadmap_item", row["id"], {"phase_id": phase_id})
    return {"id": str(row["id"])}


class FeatureCreate(BaseModel):
    title: str
    detail: Optional[str] = None
    status: str = "not_started"
    division_id: Optional[str] = None
    version_id: Optional[str] = None


@router.post("/systems/{system_id}/features")
def create_feature(request: Request, system_id: str, body: FeatureCreate):
    """Create a feature node on the project's feature board (attached to the system,
    no phase). is_feature is always true here. Lands in the given version, if any."""
    user = auth.require_admin(request)
    if body.status not in _STATUS:
        raise auth.AuthError(400, "Invalid status")
    with connect() as conn:
        nxt = conn.execute(
            text("select coalesce(max(ordering), -1) + 1 from roadmap_items where system_id = :s"),
            {"s": system_id},
        ).scalar()
        row = conn.execute(
            text("insert into roadmap_items (system_id, phase_id, division_id, version_id, title, detail, status, is_feature, ordering, created_by) "
                 "values (:s, null, :div, :ver, :t, :d, :st, true, :o, :by) returning id"),
            {"s": system_id, "div": body.division_id, "ver": body.version_id,
             "t": body.title, "d": body.detail, "st": body.status, "o": nxt, "by": user["email"]},
        ).mappings().first()
        log_activity(conn, user["email"], "created", "feature", row["id"], {"system_id": system_id})
    return {"id": str(row["id"])}


@router.patch("/items/{item_id}")
def update_item(request: Request, item_id: str, body: ItemUpdate):
    user = auth.require_admin(request)
    fields = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
    if fields.get("target_date") == "":
        fields["target_date"] = None  # empty input clears the date
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


@router.patch("/items/{item_id}/priority")
def set_item_priority(request: Request, item_id: str, body: PriorityBody):
    """Star / unstar a card. Starred cards float to the top of their board so the
    team can flag 'we want to do this next'."""
    user = auth.require_admin(request)
    with connect() as conn:
        conn.execute(
            text("update roadmap_items set priority = :p, "
                 "priority_set_at = case when :p then now() else null end where id = :id"),
            {"p": body.priority, "id": item_id},
        )
        log_activity(conn, user["email"], "priority", "roadmap_item", item_id, {"priority": body.priority})
    return {"ok": True}


@router.post("/phases/{phase_id}/items/reorder")
def reorder_items(request: Request, phase_id: str, body: ReorderBody):
    auth.require_admin(request)
    with connect() as conn:
        set_ordering(conn, "roadmap_items", body.ids)
    return {"ok": True}


@router.post("/systems/{system_id}/features/reorder")
def reorder_features(request: Request, system_id: str, body: ReorderBody):
    """Persist the feature-board card order (Kanban drag-to-reorder). Pass every
    board card's id in the desired global order; set_ordering writes ordering=index."""
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


# ─── versions (per-system iteration timeline: v1, v2, planned v3 …) ──────────
class VersionCreate(BaseModel):
    label: str
    status: str = "planned"
    note: Optional[str] = None


class VersionUpdate(BaseModel):
    label: Optional[str] = None
    status: Optional[str] = None
    note: Optional[str] = None


@router.post("/systems/{system_id}/versions")
def create_version(request: Request, system_id: str, body: VersionCreate):
    user = auth.require_admin(request)
    if body.status not in _STATUS:
        raise auth.AuthError(400, "Invalid status")
    with connect() as conn:
        nums = conn.execute(
            text("select coalesce(max(version_num), 0) + 1 as vn, coalesce(max(ordering), -1) + 1 as o "
                 "from system_versions where system_id = :s"),
            {"s": system_id},
        ).mappings().first()
        row = conn.execute(
            text("insert into system_versions (system_id, version_num, label, status, note, ordering) "
                 "values (:s, :vn, :l, :st, :n, :o) returning id"),
            {"s": system_id, "vn": nums["vn"], "l": body.label, "st": body.status,
             "n": body.note, "o": nums["o"]},
        ).mappings().first()
        log_activity(conn, user["email"], "created", "system_version", row["id"],
                     {"system_id": system_id, "version_num": nums["vn"]})
    return {"id": str(row["id"]), "version_num": nums["vn"]}


@router.patch("/versions/{version_id}")
def update_version(request: Request, version_id: str, body: VersionUpdate):
    user = auth.require_admin(request)
    fields = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
    if "status" in fields and fields["status"] not in _STATUS:
        raise auth.AuthError(400, "Invalid status")
    if not fields:
        return {"ok": True}
    sets = ", ".join(f"{k} = :{k}" for k in fields)
    fields["id"] = version_id
    with connect() as conn:
        conn.execute(text(f"update system_versions set {sets} where id = :id"), fields)
        log_activity(conn, user["email"], "updated", "system_version", version_id, {"fields": list(fields)})
    return {"ok": True}


@router.delete("/versions/{version_id}")
def delete_version(request: Request, version_id: str):
    user = auth.require_admin(request)
    with connect() as conn:
        sv = conn.execute(
            text("select system_id from system_versions where id = :id"), {"id": version_id}
        ).mappings().first()
        if sv:
            # Reassign this version's items to the lowest remaining version (or NULL
            # if it was the only one) so features are never orphaned out of the board.
            fallback = conn.execute(
                text("select id from system_versions where system_id = :s and id <> :id "
                     "order by version_num limit 1"),
                {"s": sv["system_id"], "id": version_id},
            ).scalar()
            conn.execute(
                text("update roadmap_items set version_id = :fb where version_id = :id"),
                {"fb": fallback, "id": version_id},
            )
        conn.execute(text("delete from system_versions where id = :id"), {"id": version_id})
        log_activity(conn, user["email"], "deleted", "system_version", version_id)
    return {"ok": True}


@router.post("/systems/{system_id}/versions/reorder")
def reorder_versions(request: Request, system_id: str, body: ReorderBody):
    auth.require_admin(request)
    with connect() as conn:
        set_ordering(conn, "system_versions", body.ids)
    return {"ok": True}
