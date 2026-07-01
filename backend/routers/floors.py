"""
Floors router — the `systems` table holds every top-level flooring project:
the overview, the software systems, and the business divisions (kind tells them
apart). GET is open to any logged-in user; writes require admin.
"""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Request
from pydantic import BaseModel
from sqlalchemy import text

import auth
from db import connect
from store import log_activity, set_ordering

router = APIRouter(tags=["floors"])

_VALID_KIND = {"overview", "system", "division"}
_VALID_STATUS = {"live", "in_progress", "planned", "not_started"}


class SystemCreate(BaseModel):
    slug: str
    name: str
    summary: Optional[str] = None
    kind: str = "system"
    status: str = "planned"
    accent: Optional[str] = None
    live_url: Optional[str] = None


class SystemUpdate(BaseModel):
    name: Optional[str] = None
    summary: Optional[str] = None
    kind: Optional[str] = None
    status: Optional[str] = None
    accent: Optional[str] = None
    live_url: Optional[str] = None
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None


class ReorderBody(BaseModel):
    ids: List[str]


def _row(m) -> dict:
    d = dict(m)
    d["id"] = str(d["id"])
    return d


@router.get("/systems")
def list_systems(request: Request, kind: Optional[str] = None):
    auth.require_user(request)
    sql = (
        "select s.id, s.slug, s.name, s.summary, s.kind, s.status, s.accent, s.live_url, s.ordering, s.pos_x, s.pos_y, "
        "(select count(*) from phases p where p.system_id = s.id) as phase_count, "
        "(select count(*) from roadmap_items i join phases p on p.id = i.phase_id "
        "   where p.system_id = s.id) as item_count, "
        "(select count(*) from roadmap_items i join phases p on p.id = i.phase_id "
        "   where p.system_id = s.id and i.status = 'live') as live_item_count, "
        # project milestones tagged to THIS floor as their division (only counts
        # items that live under a Project floor, kind='system') — the cross-over.
        "(select count(*) from roadmap_items i join phases p on p.id = i.phase_id "
        "   join systems ps on ps.id = p.system_id "
        "   where i.division_id = s.id and ps.kind = 'system') as project_item_count, "
        # In-progress feature cards on this floor — rendered on the overview as
        # sub-boxes under the division; clicking one opens its sub-process drawer.
        "(select coalesce(json_agg(json_build_object('id', i.id, 'title', i.title, "
        "     'detail', i.detail, 'status', i.status) order by i.ordering, i.title), '[]'::json) "
        "   from roadmap_items i where i.is_feature and i.status = 'in_progress' and "
        "   (i.system_id = s.id or i.phase_id in (select id from phases p where p.system_id = s.id))) as inprogress_projects, "
        # ALL feature cards on this floor (the division's Kanban board) — id/title/
        # status/author — so the overview can reveal every sub-project + count them.
        "(select coalesce(json_agg(json_build_object('id', i.id, 'title', i.title, "
        "     'detail', i.detail, 'status', i.status, 'created_by', i.created_by, 'priority', i.priority, "
        "     'version', (select vv.label from system_versions vv where vv.id = i.version_id)) "
        "     order by i.priority desc, i.ordering, i.title), '[]'::json) "
        "   from roadmap_items i where i.is_feature and "
        "   (i.system_id = s.id or i.phase_id in (select id from phases p where p.system_id = s.id))) as all_projects, "
        # Version timeline (v1, planned v2 …) so the overview can badge each floor.
        "(select coalesce(json_agg(json_build_object('version_num', v.version_num, "
        "     'label', v.label, 'status', v.status) order by v.ordering, v.version_num), '[]'::json) "
        "   from system_versions v where v.system_id = s.id) as versions "
        "from systems s {where} order by s.ordering, s.name"
    )
    params = {}
    where = ""
    if kind:
        where = "where s.kind = :k"
        params["k"] = kind
    with connect() as conn:
        rows = conn.execute(text(sql.format(where=where)), params).mappings().all()
    return {"systems": [_row(r) for r in rows]}


@router.get("/systems/{slug}")
def get_system(request: Request, slug: str):
    auth.require_user(request)
    with connect() as conn:
        s = conn.execute(
            text("select id, slug, name, summary, kind, status, accent, live_url, ordering "
                 "from systems where slug = :slug"),
            {"slug": slug},
        ).mappings().first()
        if not s:
            raise auth.AuthError(404, "Floor not found")
        sid = s["id"]
        phases = conn.execute(
            text("select id, layer_type, title, phase_label, detail, status, ordering, pos_x, pos_y "
                 "from phases where system_id = :sid order by ordering, title"),
            {"sid": sid},
        ).mappings().all()
        items = conn.execute(
            text("select i.id, i.phase_id, i.division_id, i.version_id, i.title, i.detail, i.status, "
                 "i.is_feature, i.ordering, d.name as division_name, d.slug as division_slug, "
                 "d.accent as division_accent "
                 "from roadmap_items i join phases p on p.id = i.phase_id "
                 "left join systems d on d.id = i.division_id "
                 "where p.system_id = :sid order by i.ordering, i.title"),
            {"sid": sid},
        ).mappings().all()
        docs = conn.execute(
            text("select id, kind, section, slug, title, ordering from doc_pages "
                 "where system_id = :sid order by kind, ordering, title"),
            {"sid": sid},
        ).mappings().all()
        # Feature board: every feature attached to this system directly (incl. those
        # with no phase). Grouped client-side into Live / In Progress / Not Yet Started.
        features = conn.execute(
            text("select i.id, i.system_id, i.phase_id, i.division_id, i.version_id, i.title, i.detail, "
                 "i.status, i.is_feature, i.ordering, i.priority, i.created_by, "
                 "d.name as division_name, d.slug as division_slug, d.accent as division_accent "
                 "from roadmap_items i left join systems d on d.id = i.division_id "
                 "where i.system_id = :sid order by i.priority desc, i.ordering, i.title"),
            {"sid": sid},
        ).mappings().all()
        versions = conn.execute(
            text("select id, version_num, label, status, note, ordering "
                 "from system_versions where system_id = :sid order by ordering, version_num"),
            {"sid": sid},
        ).mappings().all()

    items_by_phase: dict = {}
    for it in items:
        items_by_phase.setdefault(str(it["phase_id"]), []).append(_row(it))
    phase_list = []
    for p in phases:
        pd = _row(p)
        pd["items"] = items_by_phase.get(pd["id"], [])
        phase_list.append(pd)
    out = _row(s)
    out["phases"] = phase_list
    out["docs"] = [_row(d) for d in docs]
    out["features"] = [_row(f) for f in features]
    out["versions"] = [_row(v) for v in versions]
    return out


@router.post("/systems")
def create_system(request: Request, body: SystemCreate):
    user = auth.require_admin(request)
    if body.kind not in _VALID_KIND or body.status not in _VALID_STATUS:
        raise auth.AuthError(400, "Invalid kind or status")
    with connect() as conn:
        nxt = conn.execute(text("select coalesce(max(ordering), -1) + 1 from systems")).scalar()
        row = conn.execute(
            text("insert into systems (slug, name, summary, kind, status, accent, live_url, ordering) "
                 "values (:slug, :name, :summary, :kind, :status, :accent, :live_url, :o) returning id"),
            {"slug": body.slug, "name": body.name, "summary": body.summary,
             "kind": body.kind, "status": body.status, "accent": body.accent,
             "live_url": body.live_url, "o": nxt},
        ).mappings().first()
        log_activity(conn, user["email"], "created", "system", row["id"], {"name": body.name})
    return {"id": str(row["id"])}


@router.patch("/systems/{system_id}")
def update_system(request: Request, system_id: str, body: SystemUpdate):
    user = auth.require_admin(request)
    fields = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
    if "kind" in fields and fields["kind"] not in _VALID_KIND:
        raise auth.AuthError(400, "Invalid kind")
    if "status" in fields and fields["status"] not in _VALID_STATUS:
        raise auth.AuthError(400, "Invalid status")
    if not fields:
        return {"ok": True}
    sets = ", ".join(f"{k} = :{k}" for k in fields)
    fields["id"] = system_id
    with connect() as conn:
        conn.execute(text(f"update systems set {sets} where id = :id"), fields)
        log_activity(conn, user["email"], "updated", "system", system_id, {"fields": list(fields)})
    return {"ok": True}


@router.post("/systems/reorder")
def reorder_systems(request: Request, body: ReorderBody):
    user = auth.require_admin(request)
    with connect() as conn:
        set_ordering(conn, "systems", body.ids)
        log_activity(conn, user["email"], "reordered", "system", None, {"count": len(body.ids)})
    return {"ok": True}


@router.delete("/systems/{system_id}")
def delete_system(request: Request, system_id: str):
    user = auth.require_admin(request)
    with connect() as conn:
        conn.execute(text("delete from systems where id = :id"), {"id": system_id})
        log_activity(conn, user["email"], "deleted", "system", system_id)
    return {"ok": True}
