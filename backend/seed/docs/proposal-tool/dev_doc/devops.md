# DevOps & Deployment — Proposal Tool

## Hosting

- **Bluehost VPS** (Ubuntu 24.04), IP `50.6.110.215`, app dir `/opt/treadwell`.
- **Docker**: `python:3.11-slim` base + tini (PID 1) + Node 20 + the `claude` CLI.
  `EXPOSE 8888`; uvicorn binds `0.0.0.0:8888`, published to `127.0.0.1:8888` only.
- **nginx** on the host terminates TLS (Let's Encrypt / certbot, auto-renew) and
  reverse-proxies `proposals.wetreadwell.com` → `127.0.0.1:8888`.

## docker-compose

- One service, `restart: unless-stopped`, `env_file: .env`.
- Volumes: `claude_credentials:/root/.claude` (persists the CLI login across rebuilds),
  `draft_data:/app/data` (legacy SQLite, now superseded by Supabase).
- `HEALTHCHECK` curls `/healthz` (30s interval).

## Deploy / update flow

```bash
ssh root@50.6.110.215
cd /opt/treadwell
git pull origin main
docker compose up -d --build
docker compose logs -f
```

Ops shortcuts live in `ops/`: `tw-up`, `tw-down`, `tw-status`.

## Configuration (.env on the VPS, never committed)

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`,
`DROPBOX_APP_KEY/APP_SECRET/REFRESH_TOKEN`, `SUPER_ADMIN_EMAIL`, `AUTH_ALLOWED_DOMAIN`.

## First-time AI login

The `claude` CLI authenticates once: `docker exec -it treadwell-proposal-tool claude login`
→ the token persists on the `claude_credentials` volume, so rebuilds don't require re-auth.
