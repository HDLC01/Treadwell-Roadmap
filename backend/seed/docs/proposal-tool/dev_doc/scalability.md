# Scalability — Proposal Tool

## Load profile

This is an **internal tool** for a small team (single-digit concurrent users, dozens of
proposals/week). The design is sized accordingly — correctness and uptime matter far
more than throughput.

## Where it scales comfortably

- **Stateless app** → horizontally scalable in principle (add containers behind nginx);
  all state is in Supabase + Dropbox. Not needed at current volume.
- **Supabase** handles connections, backups, and Postgres scaling as a managed service.
- **File generation** is CPU-light (openpyxl/python-docx on small templates), done
  in-memory per request.

## Known bottlenecks & limits

- **Single uvicorn worker** (`--workers 1`). Fine today; bump workers or add containers
  if concurrency grows. File generation is synchronous per request.
- **AI autofill** is the slowest path (CLI subprocess, ~seconds) and is rate-limited; it's
  user-initiated, not on the hot path of normal estimating.
- **Dropbox API** rate limits apply to bulk uploads; current per-project volume is well
  under them.

## If usage grew 10×

1. Raise uvicorn workers / run 2–3 app containers behind nginx.
2. Move file generation to a background task + job status if large multi-system jobs slow
   the request.
3. Add a CDN/static cache for the (already tiny) frontend assets.

None of this is required now — the deliberate simplicity is the feature.
