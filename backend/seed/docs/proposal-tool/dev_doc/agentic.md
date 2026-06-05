# Agentic / AI — Proposal Tool

## What the AI does

The **Auto-fill with AI** button on Intake infers, from the project name + address +
lead notes:

- **7 estimate flags** — Local, Hard Bid, Prevailing Wage, Taxable, Remodel Tax,
  Drawings-dated, New/Reno (the `Epoxy!B4…B10` cells).
- **5 proposal narrative fields** — system name, texture, scope notes, schedule notes,
  exclusions.

It returns JSON with a **reasoning trail** for each field, so the estimator can see *why*
a flag was set before accepting it.

## How it's wired (no cloud API key)

- `POST /api/autofill` shells out to the **`claude` CLI as a subprocess** — it uses the
  logged-in Claude Team seat (no Anthropic API key, no per-token billing surprises).
- The CLI is baked into the Docker image (`npm install -g @anthropic-ai/claude-code`);
  the login persists on the `claude_credentials` volume.
- A ~2,000-char system prompt pins the output schema; the response is parsed as JSON and
  tagged `"via": "cli"` for logging.

## Guardrails

- **AI drafts, humans decide** — every field is editable; nothing is auto-submitted.
- **Rate limited** to 3 calls / 5 min / project; errors refund the slot.
- **Timeout** 60s; if the CLI isn't on PATH the endpoint returns an actionable message.

## Why CLI over the API

Same model quality, uses the existing Team seat, zero key management, and it mirrors the
pattern used across the other Treadwell tools (the News Feed pipeline also runs on
`claude -p`). The trade-off is that the container must stay logged in — handled by the
persistent credentials volume.
