# Treadwell Systems Showcase — CLAUDE.md

## What this is

An internal, login-gated roadmap and knowledge base for Treadwell systems. Each roadmap
is styled as an epoxy-floor installation that progresses layer by layer; each system can
also have plain-language SOPs and technical developer documentation. It is a standalone
application with its own repository, Dockerized Postgres database, container, nginx
configuration, and `roadmap.wetreadwell.com` target.

Do not import from `../treadwell-proposal-tool`, `../Treadwell AI News Feed`, or
`../Treadwell`. Reuse an idea only by copying/adapting it into this repository.

## Current architecture — verified from source on 2026-07-22

- Backend: FastAPI + SQLAlchemy/psycopg, Postgres 16, migrations in
  `backend/migrations/`, and idempotent seed data/docs in `backend/seed/`.
- Frontend: Vite + React + TypeScript + Tailwind, with dnd-kit and XYFlow for interaction,
  Framer Motion, Lucide, and Markdown rendering.
- Auth: **shared Treadwell Supabase Google SSO**, not local passwords. The SPA sends a
  bearer token; `backend/auth.py` verifies it via Supabase JWKS (with legacy HS256
  fallback), restricts accounts to `@wetreadwell.com`, and provisions the local user row.
  `DEV_LOGIN=true` is a development-only preview bypass and must never be enabled in prod.
- Authorization is stored locally: `viewer` reads, `member` can edit collaborative project
  content, and `admin` manages users plus structural content. The backend must enforce
  every frontend permission boundary.
- Deploy: Docker app + Postgres compose stack, nginx, and Let's Encrypt. Target VPS
  directory is `/opt/treadwell-roadmap`; the app binds loopback `127.0.0.1:8892`.

## Domain model

- `systems` represent three floor kinds: the single `overview`, operational `system`s,
  and business `division`s. A shared renderer displays all of them.
- `phases` are the epoxy layers (grind → repair → clean → primer → basecoat → topcoat →
  cure) mapped to delivery stages.
- `roadmap_items` represent tasks and features, with status, priority, target date,
  author, ordering, and optional division/system placement.
- `system_versions` is the version timeline. `doc_pages` stores editable SOP/developer
  Markdown. Notes, flags, activity, notifications, site notice, and user roles are
  first-class collaborative data.
- `backend/migrations/001` through `022` are the authoritative history. Add a new
  idempotent migration; never revise a migration that may already be deployed.

## Code map

| Area | Key files |
|---|---|
| Boot/middleware | `backend/main.py`, `backend/auth.py`, `backend/config.py` |
| Floors and boards | `routers/floors.py`, `routers/roadmap.py`, frontend `FloorScene`, `FloorPlan`, flow nodes |
| Docs | `routers/docs.py`, `backend/seed/docs/`, `MarkdownView.tsx` |
| Collaboration | `routers/notes.py`, `routers/notifications.py`, `NotificationBell.tsx` |
| Administration | `routers/admin.py`, `routers/notice.py`, `AdminUsersPage.tsx` |
| Database lifecycle | `migrate.py`, `migrations/`, `seed/`, `docker-compose.yml` |

## Important editing rules

- SOPs are plain-language operational instructions. Put implementation, security, and
  architecture detail in Developer Docs instead.
- Seed data is insert-only by default. Use `python -m seed --force-docs` only when the
  authored seeded Markdown should be deliberately refreshed; do not overwrite user edits.
- Use the existing confirm dialog for destructive actions, keep lists paginated at 25,
  and retain responsive/mobile behavior with no console errors.
- The app uses a local Postgres database even though authentication uses Supabase. Never
  add roadmap data to the shared auth project.

## Local development and verification

```powershell
# from the repository root
docker compose up -d db

cd backend
uvicorn main:app --reload --port 8892

cd ..\frontend
npm run dev
npm run typecheck
npm run build
```

The Vite proxy forwards API requests and bearer-auth flow to `:8892`. Migrations and
seed data run on backend startup. For the full composed stack use
`docker compose up -d --build` and inspect `/api/health`.

## Deployment guardrails

- Test locally before GitHub or VPS deployment and require Hanz's approval.
- `deploy/README.md` is the operational source of truth: it covers Supabase redirect
  URLs, production env values, nginx, certbot, backups, and update flow.
- Back up Postgres before risky migrations. Never commit credentials, JWT material,
  Supabase secrets, or VPS details.
