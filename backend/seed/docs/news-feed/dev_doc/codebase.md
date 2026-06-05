# Codebase Map — News Feed

Repo: `HDLC01/Treadwell-AI-News-Feed`. Deployed to `/opt/treadwell-newsfeed`. Single
Docker container: FastAPI serves the API + the built Vite/React SPA.

```
Treadwell AI News Feed/
├── backend/                       # FastAPI (Python 3.11)
│   ├── main.py                    # app + APScheduler lifespan + StaticFiles mount
│   ├── config.py                  # pydantic-settings (radius, recency, scheduler, email…)
│   ├── routers/                   # health, projects, contacts, digests, subscribers, admin
│   ├── services/
│   │   ├── claude_cli.py          # `claude -p --output-format json` subprocess wrapper
│   │   ├── supabase_client.py     # service-role client + HTTP/1.1 patch + retry wrapper
│   │   ├── ingest.py              # source fetch + parser registry (rss / html)
│   │   ├── signal_extractor.py    # article → structured project+team JSON (claude)
│   │   ├── clusterer.py           # dedup: order-insensitive key + claude adjudication
│   │   ├── team_enricher.py       # company resolve + GC/Dev/Owner rollup
│   │   ├── geocode.py             # US Census (+Nominatim) + Haversine + radius gate
│   │   ├── relevance_scorer.py    # 0–100 score + hot/warm/cold (claude, rule fallback)
│   │   ├── recency.py             # staleness helpers
│   │   ├── contacts_enricher.py   # article + company-site contacts; legal LinkedIn search
│   │   ├── digest_builder.py      # daily new/updated digest (HTML/text)
│   │   ├── summary.py             # 6 AM "top hottest" email (Resend)
│   │   └── mailer.py              # Resend send
│   └── jobs/daily.py              # the scheduled pipeline (Stages 0–9)
├── frontend/                      # Vite + React + TS + Tailwind
│   └── src/pages: Feed · ProjectDetail · Map · Pipeline · Digests · Admin
├── supabase/migrations/           # 001–009 idempotent SQL
├── deploy/                        # nginx server block + certbot notes + nf-up/down/status
└── Dockerfile · docker-compose.yml
```

## Conventions

- All DB access goes through `supabase_client.with_supabase_retry()`.
- All AI goes through `claude_cli` (controlled-vocab enums; off-list values dropped).
- Each source is a row in `sources` (config-as-data); a dead source never kills a run.
- The backend **starts even without Supabase/Resend** configured (health stays green).
