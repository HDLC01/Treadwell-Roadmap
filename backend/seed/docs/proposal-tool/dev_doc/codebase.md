# Codebase Map — Proposal Tool

Repo: standalone, deployed to `/opt/treadwell` on the Bluehost VPS. Single Docker
container; FastAPI serves both the API and the static frontend.

```
treadwell-proposal-tool/
├── backend/                 # FastAPI (Python 3.11)
│   ├── main.py              # ~950 lines, 20+ endpoints, auth gate, admin guards
│   ├── estimate_writer.py   # openpyxl — clones the master .xlsx, writes 30+ cells
│   ├── proposal_writer.py   # python-docx — {{token}} substitution, multi-system blocks
│   ├── pricing.py           # material recipes (epoxy / polish / cove)
│   ├── reference_tax.py     # MO/KS state+county+city+district tax lookup
│   ├── dropbox_client.py    # OAuth refresh-token flow, team-namespace upload
│   ├── supabase_client.py   # JWT verify (RS256/HS256) + @wetreadwell.com gate
│   ├── profiles.py          # user roles/status + anti-lockout guardrails
│   └── drafts.py            # project persistence + events (audit) log
├── frontend/                # plain HTML + vanilla JS (no build step)
│   ├── login.html / auth.js # Supabase Google sign-in + domain gating
│   ├── index.html           # Screen 1: Intake
│   ├── estimate-review.html # Screen 2: live pricing grid
│   ├── proposal-review.html # Screen 3: narrative
│   ├── done.html            # Screen 4: downloads + Dropbox link
│   ├── projects.html        # unified project list
│   ├── history.html         # activity log
│   ├── admin.html           # access control
│   └── shared.js            # state, draft persistence, API helpers
├── backend/templates/       # the master estimate .xlsx + proposal .docx (read-only)
├── Dockerfile / docker-compose.yml
└── ops/  tw-up · tw-down · tw-status
```

## Key entry points

- **API + static:** `uvicorn main:app --port 8888` (FastAPI mounts `frontend/` via StaticFiles).
- **Generation:** `POST /api/generate` → `estimate_writer.fill_estimate()` +
  `proposal_writer.fill_proposal()` → `dropbox_client.upload_project_files()`.
- **Live pricing:** `POST /api/price` recomputes totals from `pricing.py` on every keystroke.
- **AI autofill:** `POST /api/autofill` shells out to the `claude` CLI (see Agentic).

## Database (Supabase Postgres, project `hyjowrzgrrxrbfbaxkyu`)

`drafts` (project JSON blobs) · `events` (audit log) · `profiles` (roles/status).
The backend uses the **service-role key**; the frontend never touches the DB directly.
