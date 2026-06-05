# Treadwell Systems Showcase

An interactive, login-gated case study + knowledge base for the AI systems built for
Treadwell. Roadmaps are themed as the **epoxy-flooring install process** — each roadmap is
a floor that pours and cures layer-by-layer as you scroll. Includes per-system **SOPs**
(plain-language how-to) and **Developer Docs** (architecture, devops, security, …).

- **Live (target):** https://roadmap.wetreadwell.com
- **Stack:** FastAPI + Postgres (dockerized) + Vite/React/TS/Tailwind, single Docker
  container behind nginx + Let's Encrypt on the Bluehost VPS.
- **Repo:** https://github.com/HDLC01/Treadwell-Roadmap

## Quick start (local)
```bash
cp backend/.env.example .env      # set POSTGRES_PASSWORD, JWT_SECRET, SEED_ADMIN_PASSWORD
docker compose up -d --build      # Postgres + app; migrations + seed run on startup
open http://localhost:8892        # sign in as the seeded admin
```
Or run the pieces for development: `docker compose up -d db`, then
`cd backend && uvicorn main:app --reload --port 8892` and `cd frontend && npm run dev`.

See `CLAUDE.md` for the full model and `deploy/README.md` for production.
