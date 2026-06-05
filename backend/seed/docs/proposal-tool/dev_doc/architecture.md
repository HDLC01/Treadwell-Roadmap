# Architecture — Proposal Tool

## Shape

A deliberately **minimal single-container** web app: FastAPI is both the API and the
static file server, so there is no separate frontend deployment, no build pipeline, and
no second process to operate.

```
Browser ──HTTPS──▶ nginx (host) ──▶ 127.0.0.1:8888 (uvicorn / FastAPI)
                                       ├── /                → static HTML/JS (frontend/)
                                       ├── /api/*           → JSON endpoints
                                       ├── Supabase (Postgres)  ← service-role key
                                       ├── Dropbox API          ← refresh-token OAuth
                                       └── claude CLI subprocess ← AI autofill
```

## Request flow (generate a proposal)

1. Browser sends the project state (JSON) with a `Bearer <supabase-jwt>` header.
2. `main.py` verifies the JWT + `@wetreadwell.com` domain, then:
   - `pricing.py` computes line items → `estimate_writer.fill_estimate()` clones the
     master `.xlsx` **in memory** and writes the cells (templates are never mutated).
   - `proposal_writer.fill_proposal()` clones the `.docx` and substitutes `{{tokens}}`
     (supporting repeatable `{{#system}}…{{/system}}` blocks for multi-system jobs).
   - `dropbox_client` uploads both files to the team folder; on failure it falls back to
     direct download links so the user never leaves empty-handed.
   - `drafts.py` appends an `events` row (audit).

## Design decisions

- **No ORM / no migrations** — the schema is a small idempotent SQL file applied once in
  the Supabase editor. Three tables is not worth Alembic.
- **Templates as source of truth** — pricing + layout live in Kyle's real Excel/Word
  files, cloned per request. This keeps the output identical to what the team already trusts.
- **Stateless app, stateful DB** — the container holds no project data; everything is in
  Supabase + Dropbox, so a redeploy is a no-data-loss `docker compose up -d --build`.
