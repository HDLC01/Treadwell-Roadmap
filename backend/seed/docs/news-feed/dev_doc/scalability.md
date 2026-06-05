# Scalability — News Feed

## Load profile

Internal radar for a few users. The expensive work is the **once-daily batch pipeline**,
not interactive traffic — so cost/throughput is bounded by source count × AI calls per run,
not by concurrent users.

## Scaling levers

- **Sources are config-as-data** (`sources` table). Adding coverage = adding rows; each
  parser is isolated, so breadth grows without code changes and one dead source can't
  break a run.
- **AI cost** scales with new signals per day. Mitigations already in place: content-hash
  dedup (don't re-extract seen articles), deterministic-first dedup (AI only adjudicates
  ambiguous pairs), and recency cutoffs (skip stale items at ingest).
- **Supabase** manages Postgres scaling/backups; the `earthdistance` radius gate is indexed.
- **Stateless web tier** — the SPA + API can run multiple containers behind nginx; all
  state is in Postgres.

## Bottlenecks & limits

- **Single daily run, in-process scheduler.** Fine at current volume; a run-lock prevents
  overlap. If runs get long, shard ingestion by source group or move to a worker queue.
- **AI latency** dominates run time (sequential `claude -p` calls). Could be parallelized
  with a bounded worker pool if the source set grows large.
- **Geocoder politeness** (Nominatim 1 req/s) caps geocoding throughput; US Census is the
  primary (no limit) with Nominatim only as fallback.

## If coverage grew 10×

1. Parallelize extraction/scoring with a capped concurrency pool.
2. Split the pipeline into fetch / enrich / score workers off a queue.
3. Cache geocodes aggressively (already keyed by address) and batch source fetches.

Today the single nightly run finishes comfortably; the design favors reliability and clean
data over raw speed.
