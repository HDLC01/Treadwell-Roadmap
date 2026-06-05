# Architecture — News Feed

## Core idea

The unit is a **deduplicated project**, not an article. News / permits / filings are
*evidence* attached to a project and enriched over time. (The opposite of an article-first
RSS reader.)

```
Sources (RSS/HTML) ─▶ ingest ─▶ signal_extractor (claude) ─▶ clusterer (dedup)
                                                                   │
                       project (deduped) ◀── team_enricher ◀───────┤
                              │   ▲                                 │
                        geocode + radius                     relevance_scorer (claude)
                              │
                              ▼
            Supabase (Postgres)  ◀── FastAPI API ──▶ React SPA (Feed / Map / Pipeline)
                              │
                       digest_builder → mailer (Resend) → daily email
```

## Components

- **FastAPI** serves JSON under `/api` and the built SPA via StaticFiles (same origin).
- **APScheduler** runs the daily pipeline in-process (lifespan) when `RUN_SCHEDULER=true`;
  a manual `POST /api/admin/run-pipeline` is also available. A DB **run-lock** prevents
  overlapping runs.
- **Supabase Postgres** with the `earthdistance`/`cube` extensions for the radius gate;
  accessed server-side with the service-role key.
- **Local `claude -p` CLI** does the AI work (extraction, dedup adjudication, scoring) —
  no cloud Anthropic API.

## Notable design choices

- **Deterministic blocking + AI adjudication** for dedup: an order-insensitive key groups
  candidates cheaply; `claude` only adjudicates ambiguous pairs ("same project?").
- **Resilience:** every stage + per-item loop is wrapped — one bad source/article/extract
  never aborts the run; the pipeline records counters + status in `pipeline_runs`.
- **Recency:** stale projects (no signal in N months) are auto-archived so the radar stays current.
