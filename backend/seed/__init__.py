"""
Idempotent seed loader.

- Floors (systems / divisions / overview): inserted if the slug is missing
  (insert-only — never clobbers in-app edits).
- Phases + items: inserted only if the floor currently has zero phases.
- Doc pages: inserted if (system, kind, slug) is missing; with force_docs=True
  the title/section/body are re-synced from the authored markdown files.

Run from the app lifespan, or standalone:  python -m seed [--force-docs]
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path

from sqlalchemy import text

from db import connect, wait_for_db
from seed import data

log = logging.getLogger("roadmap.seed")
DOCS_DIR = Path(__file__).parent / "docs"


def _seed_floors(conn) -> dict:
    """Insert missing floors. Returns slug -> id for ALL floors."""
    for f in data.FLOORS:
        exists = conn.execute(text("select 1 from systems where slug = :s"), {"s": f["slug"]}).first()
        if exists:
            continue
        conn.execute(
            text("insert into systems (slug, name, summary, kind, status, accent, live_url, ordering) "
                 "values (:slug, :name, :summary, :kind, :status, :accent, :live_url, :o)"),
            {"slug": f["slug"], "name": f["name"], "summary": f.get("summary"),
             "kind": f["kind"], "status": f.get("status", "planned"),
             "accent": f.get("accent"), "live_url": f.get("live_url"), "o": f.get("ordering", 0)},
        )
        log.info("seeded floor %s", f["slug"])
    # Backfill live_url onto existing rows (the pgdata volume persists, so the
    # INSERT above won't touch them). `is null` preserves any in-app edit.
    for f in data.FLOORS:
        if f.get("live_url"):
            conn.execute(
                text("update systems set live_url = :u where slug = :s and live_url is null"),
                {"u": f["live_url"], "s": f["slug"]},
            )
    rows = conn.execute(text("select slug, id from systems")).mappings().all()
    return {r["slug"]: r["id"] for r in rows}


def _seed_features(conn, ids: dict) -> None:
    """Insert free-floating feature-board initiatives (system_id set, phase_id null).
    Insert-only keyed on (system_id, title) — the phase loader never creates these,
    and it's skipped entirely once a system has phases."""
    for fe in getattr(data, "FEATURES", []):
        sid = ids.get(fe["system"])
        if not sid:
            continue
        exists = conn.execute(
            text("select 1 from roadmap_items where system_id = :s and title = :t and phase_id is null"),
            {"s": sid, "t": fe["title"]},
        ).first()
        if exists:
            continue
        nxt = conn.execute(
            text("select coalesce(max(ordering), -1) + 1 from roadmap_items where system_id = :s"),
            {"s": sid},
        ).scalar()
        conn.execute(
            text("insert into roadmap_items (system_id, phase_id, division_id, title, detail, status, is_feature, ordering) "
                 "values (:s, null, :div, :t, :d, :st, true, :o)"),
            {"s": sid, "div": ids.get(fe.get("division")) if fe.get("division") else None,
             "t": fe["title"], "d": fe.get("detail"), "st": fe.get("status", "in_progress"), "o": nxt},
        )
        log.info("seeded feature %s -> %s", fe["system"], fe["title"])


def _seed_versions(conn, ids: dict) -> None:
    """Ensure every system has a v1 (backfilling its features to it), then insert
    any forward-looking versions from data.VERSIONS. Idempotent."""
    rows = conn.execute(text("select id, slug, status from systems")).mappings().all()
    for s in rows:
        sid = s["id"]
        v1 = conn.execute(
            text("select id from system_versions where system_id = :s and version_num = 1"),
            {"s": sid},
        ).scalar()
        if not v1:
            v1 = conn.execute(
                text("insert into system_versions (system_id, version_num, label, status, ordering) "
                     "values (:s, 1, 'v1', :st, 0) returning id"),
                {"s": sid, "st": s["status"] or "planned"},
            ).scalar()
        # Backfill: existing features on this system with no version -> v1.
        conn.execute(
            text("update roadmap_items set version_id = :v where system_id = :s and version_id is null"),
            {"v": v1, "s": sid},
        )
    # Forward-looking versions (e.g. News Feed planned v2). Insert-only by (system, version_num).
    for v in getattr(data, "VERSIONS", []):
        sid = ids.get(v["system"])
        if not sid:
            continue
        exists = conn.execute(
            text("select 1 from system_versions where system_id = :s and version_num = :n"),
            {"s": sid, "n": v["version_num"]},
        ).first()
        if exists:
            continue
        conn.execute(
            text("insert into system_versions (system_id, version_num, label, status, note, ordering) "
                 "values (:s, :n, :l, :st, :note, :o)"),
            {"s": sid, "n": v["version_num"], "l": v["label"], "st": v.get("status", "planned"),
             "note": v.get("note"), "o": v["version_num"] - 1},
        )
        log.info("seeded version %s v%s", v["system"], v["version_num"])


def _seed_phases_items(conn, ids: dict) -> None:
    for f in data.FLOORS:
        sid = ids[f["slug"]]
        has = conn.execute(text("select 1 from phases where system_id = :s limit 1"), {"s": sid}).first()
        if has:
            continue  # insert-only: floor already has phases
        for pi, phase in enumerate(f.get("phases", [])):
            prow = conn.execute(
                text("insert into phases (system_id, layer_type, title, phase_label, detail, status, ordering) "
                     "values (:s, :lt, :t, :pl, :d, :st, :o) returning id"),
                {"s": sid, "lt": phase["layer_type"], "t": phase["title"],
                 "pl": phase.get("phase_label"), "d": phase.get("detail"),
                 "st": phase.get("status", "planned"), "o": pi},
            ).mappings().first()
            for ii, item in enumerate(phase.get("items", [])):
                div_slug = item.get("division")
                conn.execute(
                    text("insert into roadmap_items (phase_id, division_id, title, detail, status, is_feature, ordering) "
                         "values (:p, :div, :t, :d, :st, :f, :o)"),
                    {"p": prow["id"], "div": ids.get(div_slug) if div_slug else None,
                     "t": item["title"], "d": item.get("detail"),
                     "st": item.get("status", "planned"), "f": item.get("is_feature", False), "o": ii},
                )
        log.info("seeded phases/items for %s", f["slug"])


def _seed_docs(conn, ids: dict, force_docs: bool) -> None:
    for d in data.DOCS:
        sid = ids.get(d["system"])
        if not sid:
            continue
        body = ""
        fp = DOCS_DIR / d["file"]
        if fp.is_file():
            body = fp.read_text(encoding="utf-8")
        existing = conn.execute(
            text("select id from doc_pages where system_id = :s and kind = :k and slug = :slug"),
            {"s": sid, "k": d["kind"], "slug": d["slug"]},
        ).mappings().first()
        if existing:
            if force_docs:
                conn.execute(
                    text("update doc_pages set title = :t, section = :sec, body_markdown = :b "
                         "where id = :id"),
                    {"t": d["title"], "sec": d.get("section"), "b": body, "id": existing["id"]},
                )
            continue
        nxt = conn.execute(
            text("select coalesce(max(ordering), -1) + 1 from doc_pages where system_id = :s and kind = :k"),
            {"s": sid, "k": d["kind"]},
        ).scalar()
        conn.execute(
            text("insert into doc_pages (system_id, kind, section, slug, title, body_markdown, ordering) "
                 "values (:s, :k, :sec, :slug, :t, :b, :o)"),
            {"s": sid, "k": d["kind"], "sec": d.get("section"), "slug": d["slug"],
             "t": d["title"], "b": body, "o": nxt},
        )
    log.info("seeded docs (force=%s)", force_docs)


def run(force_docs: bool = False) -> None:
    if not wait_for_db(timeout_s=30):
        raise RuntimeError("Postgres not reachable; cannot seed")
    with connect() as conn:
        ids = _seed_floors(conn)
        _seed_phases_items(conn, ids)
        _seed_features(conn, ids)
        _seed_versions(conn, ids)
        _seed_docs(conn, ids, force_docs)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    run(force_docs="--force-docs" in sys.argv)
