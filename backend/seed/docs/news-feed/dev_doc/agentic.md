# Agentic / AI — News Feed

All AI runs through the **local `claude -p` CLI** (`services/claude_cli.py`) — no cloud
Anthropic API, no key management. The CLI is baked into the image and logged in once on a
persistent volume.

## Where AI is used in the pipeline

| Step | Service | What the model does |
|------|---------|---------------------|
| Extraction | `signal_extractor.py` | Article/filing text → structured JSON: project name, type, stage, location, est. value/sqft/MW, team, contacts mentioned, confidence. Controlled-vocab enums; off-list values dropped. |
| Dedup adjudication | `clusterer.py` | For ambiguous candidate pairs, "are these the same project?" — only invoked when the deterministic key is inconclusive (cheap-first). |
| Relevance scoring | `relevance_scorer.py` | 0–100 score + Hot/Warm/Cold + reasoning, weighted by floor area, type, distance, recency. Deterministic rule fallback if the CLI is unavailable. |
| Contact/site lookup | `contacts_enricher.py` | Identify named people / general inboxes from a company site (in-radius only). |

## The wrapper (`claude_cli.py`)

- Invokes `claude -p --output-format json`; combines the system + user prompt on stdin,
  parses stdout JSON (`{result, is_error}`), with a loose-JSON fallback parser.
- Runs in a clean temp CWD so no stray `CLAUDE.md` meta-instructions leak into prompts.
- 120s default timeout; failures are caught so one bad item never aborts the run.

## Guardrails

- **AI drafts, humans decide** — scoring/extraction inform the radar; outreach is
  human-approved, one at a time (no batch send).
- Controlled vocabularies keep the DB clean (the model can't invent new enum values).
- Recency + dedup logic is deterministic; AI is used where judgment helps, not for bookkeeping.
