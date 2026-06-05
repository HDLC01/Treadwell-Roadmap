# Pipelines & Data Flow — News Feed

The heart of the system is the **daily pipeline** in `jobs/daily.py` — Stages 0–9, every
stage wrapped so one failure never aborts the run.

| Stage | What happens |
|------:|--------------|
| 0 | **Run-lock** — insert a `pipeline_runs` row (status=running); abort if one is active |
| 1 | **Fetch** — `ingest.fetch_all_sources()` over enabled `sources` (RSS + HTML) |
| 2 | **Extract** — per new signal (deduped by content hash), `signal_extractor` (claude) → structured project+team JSON |
| 3 | **Cluster** — `clusterer.find_or_create_project()` (order-insensitive key + claude adjudication); enrich-on-reuse |
| 4 | **Team** — `team_enricher` resolves companies, upserts GC/Dev/Owner, recomputes confidence |
| 4b | **Contacts** — from the article + (in-radius) company-site scrape; legal LinkedIn search |
| 5 | **Geocode + radius** — US Census/Nominatim → lat/lon → Haversine → in/out-radius gate |
| 6/7 | **Score + persist** — `relevance_scorer` (claude) → 0–100 + hot/warm/cold, written through |
| 7.5 | **Dedup pass** — merge same-key duplicate projects (`merged_into` + archive) |
| 8 | **Digest** — `digest_builder.build_digest(today)` (Central day) → `daily_digest` |
| 9 | **Send** — `summary.py` 6 AM "top hottest" email via Resend to Hanz + Kyle |
|  | **Finalize** — update `pipeline_runs` counters + status (success/partial/failed) |

## Triggers

- **Scheduled:** APScheduler (in-process) at 5:30 AM Central when `RUN_SCHEDULER=true`;
  on the VPS the host cron calls the admin endpoints (DST-safe, see DevOps).
- **Manual:** `POST /api/admin/run-pipeline` (respects the run-lock).

## Recency & dedup (keeping the radar clean)

- New signals older than `STALE_MONTHS` are skipped at ingest; projects with no recent
  signal are auto-archived; the summary only includes leads within `SUMMARY_RECENCY_DAYS`.
- The dedup key is **order-insensitive** (sorted, noise-stripped tokens), so "Google KC
  Northland Data Center" and "Google Data Center – KC Northland" collapse into one project.
