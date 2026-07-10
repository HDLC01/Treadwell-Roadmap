# Treadwell Systems Showcase — CLAUDE.md

## What this is
A login-gated internal site that (a) shows interactive, **editable** roadmaps of the AI
systems built for Treadwell — themed as the **epoxy-flooring install process** (a floor
that "pours" and "cures" layer-by-layer as you scroll) — and (b) hosts per-system **SOPs**
(plain-language user how-to) and **Developer Documentation** (codebase, architecture,
devops, security, pipelines, agentic, scalability). It's a case study of the work AND a
living knowledge base.

## SEPARATE SYSTEM — hard boundary
Standalone project, **own git repo**, **own subdomain**, **own dockerized Postgres**, own
container + nginx server block. It does NOT import from or deploy with:
  - ../treadwell-proposal-tool   (proposals.wetreadwell.com)
  - ../Treadwell AI News Feed    (newsfeed.wetreadwell.com)
  - ../Treadwell                 (the main Expo + FastAPI app)
Proven patterns may be COPIED, never imported. Shares only the physical VPS (50.6.110.215).

- **GitHub repo:** https://github.com/HDLC01/Treadwell-Roadmap
- **Subdomain (target):** roadmap.wetreadwell.com
- **VPS dir:** /opt/treadwell-roadmap · **container port:** 127.0.0.1:8892

## Golden rules
- **TEST LOCALLY FIRST.** Never push to GitHub or deploy to the VPS until it runs + passes
  local smoke tests AND Hanz has given the go-ahead.
- **SOPs are laymanized** (plain language, no jargon, for the Treadwell team). All
  technicalities live in the Developer Docs.
- **Login-gated** — no public pages. Any signed-in @wetreadwell.com user can add /
  edit / star / delete **projects** (feature cards) — the whole team plans together.
  **Admins** (Hanz) additionally get the admin dashboard (user management) + structural
  edits (divisions, systems, phases, versions, docs, notice bar). Frontend gates on
  `canEdit` (any authed) vs `isAdmin`; the backend re-enforces (`require_user` for
  project writes, `require_admin` for structural + user management).

## Core model
- A **floor** = a top-level flooring project (a roadmap). `systems` table, `kind` ∈
  `overview | system | division`. One shared epoxy renderer for all three.
  - **systems**: shipped software (Proposal Tool, News Feed) — get SOP + Dev Docs.
  - **divisions**: business areas (Operations, Finance, Sales & Marketing, Admin & IT) —
    "each Division is its own flooring project."
  - **overview**: the single master "AI Implementation" floor.
- **phases** = epoxy layers (grind→repair→clean→primer→basecoat→topcoat→cure) mapped to
  software phases (Discovery→…→Live).
- **roadmap_items** = tasks; `status` ∈ live | in_progress | planned | not_started;
  `is_feature` → renders as a flake; **`division_id`** tags every task with its Division.
- **doc_pages** = SOP + dev_doc markdown, editable in-app.

## Stack
- Backend: FastAPI (3.11), SQLAlchemy 2.0 + psycopg 3, bcrypt + PyJWT. No AI/claude here.
- DB: **Postgres 16** — local for dev, dockerized on the VPS (NOT Supabase).
- Migrations: idempotent `backend/migrations/NNN_*.sql`, run by `migrate.py` on startup.
- Seed: `backend/seed/` — idempotent, insert-only by default (`python -m seed --force-docs`
  to re-sync authored markdown). Roadmap data in `seed/data.py`; docs in `seed/docs/`.
- Frontend: Vite + React + TS + Tailwind + lucide-react + framer-motion + react-markdown.
  Design via the **UI/UX Pro Max** skill.
- Deploy: multi-stage Docker, two-service compose (app + postgres), nginx + Let's Encrypt.

## Auth
Local email+password (bcrypt) + stateless HS256 JWT in an HttpOnly cookie. Whole site
gated by the auth middleware in `main.py` (public: `/api/health`, `/api/auth/login`).
Seeded admin = `hanz@wetreadwell.com` (from `SEED_ADMIN_PASSWORD`). Anti-lockout: can't
disable/delete self or the seeded admin.

## Run locally
- DB:       `docker compose up -d db`  (or a local Postgres on :5433)
- Backend:  `cd backend && uvicorn main:app --reload --port 8892`
- Frontend: `cd frontend && npm run dev`  (Vite proxy /api → :8892, forwards the cookie)
- Or the whole stack: `docker compose up -d --build` → http://localhost:8892
- Migrations + seed run automatically on app startup.

## Deploy (only after local tests pass + Hanz approves)
- DNS A-record `roadmap` → 50.6.110.215. nginx server block → certbot. See `deploy/`.
- `git pull && docker compose up -d --build` (migrations auto-apply; `pgdata` persists).
- Daily `pg_dump` backup recommended before risky migrations.
