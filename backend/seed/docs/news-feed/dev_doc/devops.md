# DevOps & Deployment — News Feed

## Hosting

- **Bluehost VPS** `50.6.110.215`, app dir `/opt/treadwell-newsfeed` (separate from the
  proposal tool's `/opt/treadwell`).
- **Multi-stage Docker**: `node:20-slim` builds the SPA → `python:3.11-slim` runtime with
  Node + the `claude` CLI baked in. `EXPOSE 8890`; bound to `127.0.0.1:8890`.
- **nginx** terminates TLS (certbot) and proxies `newsfeed.wetreadwell.com` → `:8890`.

## docker-compose

Single service, `restart: unless-stopped`, `env_file: .env`, healthcheck on `/api/health`,
and a `claude_credentials:/root/.claude` volume so the CLI login survives rebuilds.

## Deploy / update

```bash
git archive HEAD | ssh root@50.6.110.215 \
  'cd /opt/treadwell-newsfeed && tar -xf - && docker compose up -d --build'
curl -fsS https://newsfeed.wetreadwell.com/api/health
```

Kill switch: `nf-down` / `nf-up` / `nf-status` (see `deploy/KILL_SWITCH.md`).

## Scheduling — a real-world gotcha

The daily jobs run from the **host** `/etc/cron.d` (5:30 AM pipeline, 6:00 AM email). The
VPS clock is **UTC** and Ubuntu's cron **ignores `CRON_TZ`**, so the jobs fire at both
candidate UTC hours and gate on the real Chicago hour — DST-safe without touching the host
timezone:

```cron
0 11,12 * * * root [ "$(TZ=America/Chicago date +\%H)" = "06" ] && curl ... /api/admin/send-hot-summary
```

## Migrations

Idempotent `supabase/migrations/001–009` applied via the Supabase SQL editor / Management API.
