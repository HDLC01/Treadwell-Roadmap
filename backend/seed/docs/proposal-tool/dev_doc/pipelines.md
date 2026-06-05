# Pipelines & Data Flow — Proposal Tool

There is no background/batch pipeline here — the tool is **request-driven**. The two
data flows that matter are *generation* and *live pricing*.

## Generation flow

```
Intake (browser) ──┐
Estimate edits ────┼─▶ project state (JSON) ──POST /api/generate──▶ FastAPI
Proposal narrative ┘                                                  │
                                                                      ├─ pricing.py            → line items + totals
                                                                      ├─ estimate_writer.py    → .xlsx (in-memory clone)
                                                                      ├─ proposal_writer.py    → .docx (token substitution)
                                                                      ├─ dropbox_client.py     → upload to team folder
                                                                      └─ drafts.py             → events row (audit)
                                                                      ▼
                                                          download links + Dropbox folder link
```

## Live pricing loop

As the user edits Screen 2, the browser debounces and calls `POST /api/price` with the
current inputs; `pricing.py` returns recomputed totals. Recipes (`pricing_recipes.json`)
were extracted from the master estimate sheet and verified against real estimates.

## Persistence flow

Drafts autosave to `public.drafts` (JSON blob keyed by a client UUID) so a project can be
reopened from any device; `public.events` records `created` / `generated` actions.

## Failure handling

- Dropbox failure → **non-fatal**: the response still includes direct download links.
- `claude` CLI missing/slow → autofill returns a clear message and **refunds** the
  rate-limit slot (an error never burns the project's budget).
