"""
Seed data — floors (overview + systems + divisions), their epoxy phases + tasks,
and the doc-page manifest. Authored from the project CLAUDE.md / SPEC / README
files and Hanz's progress tracker. All of this is editable in-app after seeding.

Epoxy layer -> software phase mapping:
  grind=Discovery  repair=Fix manual process  clean=Setup  primer=Architecture
  basecoat=Core build (features=flakes)  topcoat=Hardening/Deploy  cure=Live
Status: live | in_progress | planned | not_started.  division = tag slug.
"""

from __future__ import annotations

# ─────────────────────────────────────────────────────────────────────────
FLOORS = [
    # ===================== MASTER OVERVIEW =====================
    {
        "slug": "ai-implementation", "name": "AI Implementation", "kind": "overview",
        "status": "in_progress", "accent": "#1E40AF", "ordering": 0,
        "summary": "Treadwell's AI roadmap — ROI-first (Sales > Cost > Admin), 1–2 projects at a time, "
                   "each delivering value in 2–4 weeks. Two systems shipped; more in flight.",
        "phases": [
            {"layer_type": "grind", "title": "Discovery & Strategy", "phase_label": "Phase 0 — Strategy", "status": "live",
             "items": [
                 {"title": "AI implementation roadmap defined (Phases 1–4)", "status": "live", "division": "admin-it"},
                 {"title": "ROI-first prioritization rule (Sales > Cost > Admin)", "status": "live", "division": "finance"},
                 {"title": "Idea intake + monthly AI-led brainstorm cadence", "status": "in_progress", "division": "admin-it"},
             ]},
            {"layer_type": "primer", "title": "Phase 1 — Fast ROI", "phase_label": "0–45 days · sales support", "status": "in_progress",
             "items": [
                 {"title": "Speed-to-lead: capture + qualify inbound leads", "status": "in_progress", "division": "sales-marketing"},
                 {"title": "Email drafting / inbox support", "status": "planned", "division": "admin-it"},
                 {"title": "Light proposal drafting support", "status": "live", "division": "sales-marketing"},
             ]},
            {"layer_type": "basecoat", "title": "Phase 2 — Sales System", "phase_label": "45–120 days · revenue engine", "status": "in_progress",
             "items": [
                 {"title": "Proposal generation + approval + send", "status": "live", "is_feature": True, "division": "sales-marketing"},
                 {"title": "AI News Feed — opportunity radar", "status": "live", "is_feature": True, "division": "sales-marketing"},
                 {"title": "AI lead qualification (Hot/Warm/Cold)", "status": "in_progress", "is_feature": True, "division": "sales-marketing"},
                 {"title": "CRM logging + follow-ups", "status": "planned", "division": "sales-marketing"},
                 {"title": "Voice → scope → estimate input", "status": "planned", "division": "operations"},
             ]},
            {"layer_type": "topcoat", "title": "Phase 3 — Cost Control", "phase_label": "90–180 days · margin", "status": "planned",
             "items": [
                 {"title": "Labor vs estimate tracking", "status": "planned", "division": "finance"},
                 {"title": "Material usage / variance alerts", "status": "planned", "division": "operations"},
                 {"title": "WIP generation + report comparison", "status": "planned", "division": "finance"},
                 {"title": "Vehicle GPS vs schedule", "status": "not_started", "division": "operations"},
             ]},
            {"layer_type": "cure", "title": "Phase 4 — Advanced Optimization", "phase_label": "180+ days · monitoring", "status": "not_started",
             "items": [
                 {"title": "Shop / vehicle / jobsite cameras", "status": "not_started", "division": "operations"},
                 {"title": "Behavioral insights + coaching notifications", "status": "not_started", "division": "operations"},
             ]},
        ],
    },

    # ===================== SYSTEM: PROPOSAL TOOL =====================
    {
        "slug": "proposal-tool", "name": "Proposal & Estimate Tool", "kind": "system",
        "status": "live", "accent": "#0EA5E9", "ordering": 1,
        "live_url": "https://proposals.wetreadwell.com",
        "summary": "Live at proposals.wetreadwell.com. Turns a lead into a dollar-accurate estimate "
                   "(Excel) + a branded proposal (Word) you can download - including the proposal as "
                   "a PDF - with AI autofill.",
        "phases": [
            {"layer_type": "grind", "title": "Discovery", "phase_label": "Discovery", "status": "live",
             "items": [
                 {"title": "Studied how proposals are made today", "status": "live", "division": "sales-marketing"},
                 {"title": "Designed a simple 4-step flow (info → estimate → proposal → done)", "status": "live", "division": "sales-marketing"},
             ]},
            {"layer_type": "repair", "title": "Fix the manual process", "phase_label": "Repair", "status": "live",
             "items": [
                 {"title": "Removed copy-pasting between spreadsheets", "status": "live", "division": "finance"},
                 {"title": "No more entering the same info twice", "status": "live", "is_feature": True, "division": "sales-marketing"},
             ]},
            {"layer_type": "clean", "title": "Setup", "phase_label": "Setup", "status": "live",
             "items": [
                 {"title": "Built the app foundation", "status": "live", "division": "admin-it"},
                 {"title": "Set up the secure database", "status": "live", "division": "admin-it"},
                 {"title": "Loaded our Excel & Word templates", "status": "live", "division": "finance"},
             ]},
            {"layer_type": "primer", "title": "Foundation", "phase_label": "Foundation", "status": "live",
             "items": [
                 {"title": "Built the estimate calculator", "status": "live", "division": "finance"},
                 {"title": "Built the proposal document generator", "status": "live", "division": "sales-marketing"},
                 {"title": "Download finished files - no forced Dropbox folder", "status": "live", "division": "admin-it"},
                 {"title": "Added Kansas & Missouri sales-tax lookup", "status": "live", "division": "finance"},
             ]},
            {"layer_type": "basecoat", "title": "Core features", "phase_label": "Core build", "status": "live",
             "items": [
                 {"title": "One-click estimate + proposal - download Excel, Word & PDF", "status": "live", "is_feature": True, "division": "sales-marketing"},
                 {"title": "Download the proposal as a PDF (matches the Word)", "status": "live", "is_feature": True, "division": "sales-marketing"},
                 {"title": "Proposals fill in completely every time (name, scope, site-visit date)", "status": "live", "is_feature": True, "division": "sales-marketing"},
                 {"title": "Re-download any job's files from Projects (no re-entry)", "status": "live", "is_feature": True, "division": "sales-marketing"},
                 {"title": "Files download with their real name", "status": "live", "division": "admin-it"},
                 {"title": "AI fills the estimate from a few notes", "status": "live", "is_feature": True, "division": "sales-marketing"},
                 {"title": "Pricing matches our master sheet to the dollar", "status": "live", "is_feature": True, "division": "finance"},
                 {"title": "Handles multi-system jobs, extras & remodel tax", "status": "live", "is_feature": True, "division": "finance"},
             ]},
            {"layer_type": "topcoat", "title": "Security & Launch", "phase_label": "Security & Launch", "status": "live",
             "items": [
                 {"title": "Secure company sign-in (Google)", "status": "live", "division": "admin-it"},
                 {"title": "Shared project list for the whole team", "status": "live", "division": "sales-marketing"},
                 {"title": "Activity history + admin controls", "status": "live", "division": "admin-it"},
                 {"title": "Hosted online — secure and always-on", "status": "live", "division": "admin-it"},
             ]},
            {"layer_type": "cure", "title": "Live", "phase_label": "Live", "status": "live",
             "items": [
                 {"title": "Live 24/7 at proposals.wetreadwell.com", "status": "live", "division": "admin-it"},
                 {"title": "Pricing confirmed by Kyle (Jun 2, 2026)", "status": "live", "division": "finance"},
                 {"title": "Works on phones", "status": "in_progress", "division": "sales-marketing"},
             ]},
        ],
    },

    # ===================== SYSTEM: NEWS FEED =====================
    {
        "slug": "news-feed", "name": "AI News Feed — Treadwell Radar", "kind": "system",
        "status": "live", "accent": "#7C3AED", "ordering": 2,
        "live_url": "https://newsfeed.wetreadwell.com",
        "summary": "Live at newsfeed.wetreadwell.com. A project-first construction-opportunity radar — "
                   "surfaces large flooring opportunities early, with team/contacts, a map, and a daily digest.",
        "phases": [
            {"layer_type": "grind", "title": "Discovery", "phase_label": "Discovery", "status": "live",
             "items": [
                 {"title": "Decided to track projects, not just news", "status": "live", "division": "sales-marketing"},
                 {"title": "Set how far out to look for jobs (by type)", "status": "live", "division": "sales-marketing"},
             ]},
            {"layer_type": "repair", "title": "Fix the manual process", "phase_label": "Repair", "status": "live",
             "items": [
                 {"title": "Replaced manually hunting for construction leads", "status": "live", "division": "sales-marketing"},
             ]},
            {"layer_type": "clean", "title": "Setup", "phase_label": "Setup", "status": "live",
             "items": [
                 {"title": "Built the app foundation", "status": "live", "division": "admin-it"},
             ]},
            {"layer_type": "primer", "title": "Foundation", "phase_label": "Foundation", "status": "live",
             "items": [
                 {"title": "Built the system that finds & ranks projects", "status": "live", "division": "admin-it"},
                 {"title": "AI reads articles and scores each lead", "status": "live", "division": "admin-it"},
                 {"title": "Set up the database", "status": "live", "division": "admin-it"},
             ]},
            {"layer_type": "basecoat", "title": "Core features", "phase_label": "Core build", "status": "live",
             "items": [
                 {"title": "Finds projects and ranks them Hot / Warm / Cold", "status": "live", "is_feature": True, "division": "sales-marketing"},
                 {"title": "Feed, radar map, pipeline & admin screens", "status": "live", "is_feature": True, "division": "sales-marketing"},
                 {"title": "Radar map of opportunities around the office", "status": "live", "is_feature": True, "division": "sales-marketing"},
                 {"title": "Removes duplicate & out-of-date leads", "status": "live", "is_feature": True, "division": "operations"},
                 {"title": "Daily 6 AM email of the hottest leads", "status": "live", "is_feature": True, "division": "sales-marketing"},
                 {"title": "Custom Claude connector - leads, summaries & outreach drafts in Claude Desktop", "status": "live", "is_feature": True, "division": "sales-marketing"},
                 {"title": "Finds the project team & contacts", "status": "in_progress", "division": "sales-marketing"},
             ]},
            {"layer_type": "topcoat", "title": "Security & Launch", "phase_label": "Security & Launch", "status": "live",
             "items": [
                 {"title": "Shows dates in our local time", "status": "live", "division": "admin-it"},
                 {"title": "Reliable automatic daily scheduling", "status": "live", "division": "admin-it"},
                 {"title": "Hosted online — secure, with an on/off switch", "status": "live", "division": "admin-it"},
             ]},
            {"layer_type": "cure", "title": "Live", "phase_label": "Live", "status": "live",
             "items": [
                 {"title": "Live at newsfeed.wetreadwell.com", "status": "live", "division": "admin-it"},
                 {"title": "Runs automatically every morning", "status": "live", "division": "operations"},
                 {"title": "Pending: office address + contact-search key", "status": "planned", "division": "sales-marketing"},
             ]},
        ],
    },

    # ===================== DIVISION: OPERATIONS =====================
    {
        "slug": "operations", "name": "Operations", "kind": "division",
        "status": "planned", "accent": "#D97706", "ordering": 3,
        "summary": "Field ops, scheduling, production, and cost-control tooling — turning estimates into "
                   "tracked, profitable jobs.",
        "phases": [
            {"layer_type": "grind", "title": "Discovery", "phase_label": "Discovery", "status": "in_progress",
             "items": [
                 {"title": "Map scheduling + site-visit coordination pain", "status": "in_progress", "division": "operations"},
             ]},
            {"layer_type": "primer", "title": "Foundation", "phase_label": "Foundation", "status": "planned",
             "items": [
                 {"title": "Site-visit scheduling + calendar integration", "status": "planned", "division": "operations"},
                 {"title": "Project-won handoff sheet (Foundation + Raken setup)", "status": "planned", "division": "operations"},
             ]},
            {"layer_type": "basecoat", "title": "Cost control", "phase_label": "Core build", "status": "planned",
             "items": [
                 {"title": "Labor vs estimate auto-tracking", "status": "planned", "division": "operations"},
                 {"title": "Material usage / variance alerts", "status": "planned", "division": "operations"},
                 {"title": "Raken compliance checks + daily-report alerts", "status": "planned", "division": "operations"},
             ]},
            {"layer_type": "topcoat", "title": "Monitoring", "phase_label": "Hardening", "status": "not_started",
             "items": [
                 {"title": "Vehicle GPS vs schedule", "status": "not_started", "division": "operations"},
             ]},
            {"layer_type": "cure", "title": "Advanced", "phase_label": "Live", "status": "not_started",
             "items": [
                 {"title": "Shop / vehicle / jobsite camera review", "status": "not_started", "division": "operations"},
             ]},
        ],
    },

    # ===================== DIVISION: FINANCE =====================
    {
        "slug": "finance", "name": "Finance", "kind": "division",
        "status": "in_progress", "accent": "#059669", "ordering": 4,
        "summary": "Estimating accuracy, margins, WIP, and vendor-cost intelligence.",
        "phases": [
            {"layer_type": "primer", "title": "Foundation", "phase_label": "Foundation", "status": "live",
             "items": [
                 {"title": "Dollar-accurate pricing engine (via Proposal Tool)", "status": "live", "division": "finance"},
                 {"title": "KS county remodel-tax handling", "status": "live", "division": "finance"},
             ]},
            {"layer_type": "basecoat", "title": "Reporting", "phase_label": "Core build", "status": "planned",
             "items": [
                 {"title": "WIP generation + report comparison", "status": "planned", "division": "finance"},
                 {"title": "Month-to-month change in profit", "status": "planned", "division": "finance"},
                 {"title": "Jobs that fell off the report: final vs estimated GP", "status": "planned", "division": "finance"},
             ]},
            {"layer_type": "topcoat", "title": "Cost intelligence", "phase_label": "Hardening", "status": "not_started",
             "items": [
                 {"title": "Soft-cost / vendor-price YoY analysis", "status": "not_started", "division": "finance"},
                 {"title": "Metric-sheet auto-update from Basis Board", "status": "not_started", "division": "finance"},
             ]},
        ],
    },

    # ===================== DIVISION: SALES & MARKETING =====================
    {
        "slug": "sales-marketing", "name": "Sales & Marketing", "kind": "division",
        "status": "in_progress", "accent": "#DC2626", "ordering": 5,
        "summary": "Leads, proposals, CRM, opportunity radar, and social — the revenue engine.",
        "phases": [
            {"layer_type": "primer", "title": "Foundation", "phase_label": "Foundation", "status": "live",
             "items": [
                 {"title": "Proposal generation tool (LIVE)", "status": "live", "is_feature": True, "division": "sales-marketing"},
                 {"title": "AI News Feed opportunity radar (LIVE)", "status": "live", "is_feature": True, "division": "sales-marketing"},
             ]},
            {"layer_type": "basecoat", "title": "Pipeline", "phase_label": "Core build", "status": "in_progress",
             "items": [
                 {"title": "AI lead qualification before it reaches Troy", "status": "in_progress", "division": "sales-marketing"},
                 {"title": "Instant lead auto-response email", "status": "planned", "division": "sales-marketing"},
                 {"title": "CRM auto-call list (5/week) + coaching script", "status": "planned", "division": "sales-marketing"},
                 {"title": "LinkedIn post drafts + scheduled posting", "status": "in_progress", "division": "sales-marketing"},
             ]},
            {"layer_type": "topcoat", "title": "Customer visibility", "phase_label": "Hardening", "status": "planned",
             "items": [
                 {"title": "Customer portal (sales-cycle visibility)", "status": "planned", "division": "sales-marketing"},
                 {"title": "Customer portal ↔ employee CRM real-time sync", "status": "not_started", "division": "sales-marketing"},
             ]},
        ],
    },

    # ===================== DIVISION: ADMIN & IT =====================
    {
        "slug": "admin-it", "name": "Admin & IT", "kind": "division",
        "status": "in_progress", "accent": "#475569", "ordering": 6,
        "summary": "Internal tools, infrastructure, access control, and replacing SaaS subscriptions.",
        "phases": [
            {"layer_type": "clean", "title": "Infrastructure", "phase_label": "Setup", "status": "live",
             "items": [
                 {"title": "Bluehost VPS (24/7) + Docker + nginx + Let's Encrypt", "status": "live", "division": "admin-it"},
                 {"title": "Google sign-in (@wetreadwell.com) for tools", "status": "live", "division": "admin-it"},
             ]},
            {"layer_type": "basecoat", "title": "Internal tools", "phase_label": "Core build", "status": "in_progress",
             "items": [
                 {"title": "Email sorting + drafting (replicate Kylene)", "status": "planned", "division": "admin-it"},
                 {"title": "Unified CRM (one source of truth)", "status": "planned", "division": "admin-it"},
                 {"title": "Replace/reduce SaaS subscriptions", "status": "planned", "division": "admin-it"},
             ]},
            {"layer_type": "topcoat", "title": "Integration", "phase_label": "Hardening", "status": "in_progress",
             "items": [
                 {"title": "Custom Claude connector (News Feed to Claude Desktop)", "status": "live", "division": "admin-it"},
             ]},
        ],
    },
]


# ─────────────────────────────────────────────────────────────────────────
# Doc-page manifest. `file` is relative to backend/seed/docs/.
_DEV_SECTIONS = [
    ("codebase", "Codebase Map"),
    ("architecture", "Architecture"),
    ("devops", "DevOps & Deployment"),
    ("security", "Cybersecurity"),
    ("pipelines", "Pipelines & Data Flow"),
    ("agentic", "Agentic / AI"),
    ("scalability", "Scalability"),
]


def _docs_for(system: str) -> list:
    out = [{"system": system, "kind": "sop", "section": None, "slug": "overview",
            "title": "Standard Operating Procedure", "file": f"{system}/sop/overview.md"}]
    for i, (slug, title) in enumerate(_DEV_SECTIONS):
        out.append({"system": system, "kind": "dev_doc", "section": slug, "slug": slug,
                    "title": title, "file": f"{system}/dev_doc/{slug}.md"})
    return out


DOCS = (
    [{"system": "ai-implementation", "kind": "sop", "section": None, "slug": "about",
      "title": "About this Showcase", "file": "ai-implementation/sop/about.md"}]
    + _docs_for("proposal-tool")
    + _docs_for("news-feed")
)


# ── Free-floating feature-board initiatives (system_id set, phase_id null). ──
# Each is a PROJECT CARD on its container's (division's) feature board, sourced
# from the "AI Treadwell Ideas" Google Doc (June 3 Progress Tracker + idea
# sections) so the roadmap is the living home for every idea. Live + in-progress
# cards carry a markdown sub-process (rendered in the click-through drawer);
# planned/future cards carry a one-line "planned approach". Seeded insert-only by
# (system, title). No `division` set → no redundant self-badge on the own board.

_SUB_LEAD_QUAL = (
    "When a new lead comes in, AI reads it and labels it **Hot**, **Warm**, or **Cold** so Troy "
    "knows who to call first — before spending time on it.\n\n"
    "### Sub-process\n"
    "1. A new lead arrives (website form or the shared inbox) and is captured into the system.\n"
    "2. AI reads the lead's details — project type, size, urgency, the message — and sorts it Hot / Warm / Cold.\n"
    "3. It writes a one-line summary and the priority onto the lead so the team sees at a glance which to chase.\n"
    "4. **In progress:** running this automatically on every inbound lead in the background, so no lead waits to be ranked.\n"
    "5. **Next:** surface the ranked leads at the top of the CRM / inbox so the hottest get the first call.\n"
)

_SUB_LINKEDIN = (
    "Drafts LinkedIn and social posts in Treadwell's voice — building toward scheduled auto-posting "
    "so the company stays visible without writing every post from scratch.\n\n"
    "### Sub-process\n"
    "1. **Done:** analyzed all 22 of Treadwell's existing posts to capture the company's writing voice (saved as style notes).\n"
    "2. **Done:** produced ready-to-use drafts (e.g. UHG Pharmacy, HiPower Systems), including short videos to go with them.\n"
    "3. Gather the raw material for a new post — a job photo, a project story, or a customer win.\n"
    "4. Generate a draft in Treadwell's voice for the chosen platform, then review and edit before it goes out.\n"
    "5. **Next:** connect the social accounts so approved posts publish automatically on a schedule (today the drafts are made by hand).\n"
)

_SUB_IDEA_INTAKE = (
    "A standing monthly routine where AI helps the team capture new improvement ideas and rank them by "
    "payback, so the roadmap never goes stale.\n\n"
    "### Sub-process\n"
    "1. Collect new ideas as they come up through the month (team, customers, day-to-day pain points) into one running list.\n"
    "2. On a monthly cadence, AI reviews the new ideas against the existing roadmap and groups duplicates or related items.\n"
    "3. AI scores each idea by ROI — value or savings vs. the effort and time to build — and ranks them.\n"
    "4. The ranked ideas are added to the roadmap pipeline so high-payback items rise to the top.\n"
    "5. **Next:** lock in the recurring monthly trigger and a standard ROI scoring rubric so every brainstorm ranks ideas the same way.\n"
)

_SUB_ASSESS = (
    "Treadwell's own hiring assessment — a Predictive-Index-style behavioral test built in-house on "
    "**100% original content** (never PI's material), so we can screen applicants for fit on our own platform.\n\n"
    "### Sub-process\n"
    "1. **Done:** built the foundation — a candidate web app, a backend, and a database, all running and smoke-tested locally.\n"
    "2. **Done:** wrote our own assessment content — an 88-word word-choice bank, a DISC-style behavioral model, and 13 original archetypes.\n"
    "3. **Next:** build the candidate flow (invite → take the assessment → submit) so a real applicant can complete it start to finish.\n"
    "4. **Next:** turn the answers into a readable fit report (archetype + behavioral profile) a hiring manager can act on.\n"
    "5. **Next:** tie assessments to specific job openings and give Treadwell staff a place to review and compare results.\n"
    "6. **Then:** pilot it on a real open position before making it our standard screening step.\n\n"
    "*Status: built and tested locally — not yet deployed to a public site.*\n"
)

FEATURES = [
    # ===================== SALES & MARKETING (revenue engine — highest ROI) =====================
    {"system": "sales-marketing", "status": "in_progress", "title": "AI lead qualification (Hot / Warm / Cold)", "detail": _SUB_LEAD_QUAL},
    {"system": "sales-marketing", "status": "in_progress", "title": "LinkedIn + social posting", "detail": _SUB_LINKEDIN},
    {"system": "sales-marketing", "status": "planned", "title": "Customer project portal",
     "detail": "Customers log in to see their project's sales-cycle status: proposal pending, approved, deposit collected, scheduled, and assigned to a PM."},
    {"system": "sales-marketing", "status": "planned", "title": "CRM auto-call list (5/week) + script",
     "detail": "Auto-builds Troy a weekly list of 5 customers to call — each with their info pulled up — plus a tuned, not-too-long sales-call script."},
    {"system": "sales-marketing", "status": "planned", "title": "Auto-capture + log website leads",
     "detail": "Automatically capture inbound website leads and log them across HubSpot and Basis Board, instead of pasting them in by hand."},
    {"system": "sales-marketing", "status": "planned", "title": "Instant lead auto-response email",
     "detail": "Sends an immediate branded reply to every new lead so we're first to respond (speed-to-lead)."},
    {"system": "sales-marketing", "status": "planned", "title": "Automated follow-ups + call reminders",
     "detail": "Automatic follow-up emails plus call reminders, sequenced around the rep's driving time so nothing slips."},

    # ===================== OPERATIONS (field + cost control) =====================
    {"system": "operations", "status": "planned", "title": "Auto-schedule site visits + calendar",
     "detail": "Books site visits and syncs them to the team calendar automatically."},
    {"system": "operations", "status": "planned", "title": "Voice → scope → estimate input",
     "detail": "Speak the job scope on-site and have it turn into structured inputs for the estimate."},
    {"system": "operations", "status": "planned", "title": "Project-won handoff sheet",
     "detail": "When a job is won, auto-create the handoff sheet and set the project up in Foundation + Raken."},
    {"system": "operations", "status": "planned", "title": "Raken compliance checks + alerts",
     "detail": "Checks the daily Raken reports for compliance and alerts the team when one is missing or off."},
    {"system": "operations", "status": "planned", "title": "Labor vs estimate tracking",
     "detail": "Tracks actual labor against the estimate to catch overruns early."},
    {"system": "operations", "status": "planned", "title": "Material usage / variance alerts",
     "detail": "Flags when material usage drifts from the estimated quantities."},
    {"system": "operations", "status": "not_started", "title": "Vehicle GPS vs schedule",
     "detail": "Compares vehicle GPS against the day's schedule to spot gaps."},
    {"system": "operations", "status": "not_started", "title": "Shop / vehicle / jobsite cameras",
     "detail": "Camera monitoring across the shop, vehicles, and jobsites — activity, materials, productivity, driving behavior, and jobsite quality."},
    {"system": "operations", "status": "not_started", "title": "Behavioral insights + coaching alerts",
     "detail": "Turns the camera/GPS monitoring into automated alerts and coaching notifications for the team."},

    # ===================== FINANCE (margins + reporting) =====================
    {"system": "finance", "status": "planned", "title": "WIP generation + report comparison",
     "detail": "Generates the WIP report and compares it run-over-run."},
    {"system": "finance", "status": "planned", "title": "Month-to-month profit change",
     "detail": "Shows how profit moves month over month off the WIP data."},
    {"system": "finance", "status": "planned", "title": "Jobs that fell off the report: final vs estimated GP",
     "detail": "For jobs that drop off the WIP, compares final gross profit to the prior estimate."},
    {"system": "finance", "status": "not_started", "title": "Soft-cost / vendor pricing YoY",
     "detail": "Year-over-year analysis of soft costs and vendor price changes."},
    {"system": "finance", "status": "not_started", "title": "Metric-sheet auto-update from Basis Board",
     "detail": "Auto-updates company metric sheets by pulling from Basis Board and other platforms."},

    # ===================== ADMIN & IT (internal tools + people) =====================
    {"system": "admin-it", "status": "in_progress", "title": "Idea intake + monthly AI brainstorm", "detail": _SUB_IDEA_INTAKE},
    {"system": "admin-it", "status": "in_progress", "title": "Treadwell Assess (hiring assessment)", "detail": _SUB_ASSESS},
    {"system": "admin-it", "status": "planned", "title": "AI email sorting + drafting",
     "detail": "Sorts the inbox and drafts replies, replicating how Kylene handles email."},
    {"system": "admin-it", "status": "planned", "title": "Unified CRM (one source of truth)",
     "detail": "One CRM that all tools and the Excel sheet sync to, ending scattered records."},
    {"system": "admin-it", "status": "planned", "title": "Replace / reduce SaaS subscriptions",
     "detail": "Build in-house software to cut paid subscriptions (CRM, job notes & photos, Superhuman, etc.)."},
    {"system": "admin-it", "status": "not_started", "title": "Verbal coaching bot (team practice + call script)",
     "detail": "A practice bot that role-plays procedures and customer conversations — and helps tune the sales call script — so the team rehearses verbal engagement."},
]


# ── Version-timeline entries BEYOND the auto-seeded v1. ──
# _seed_versions ensures every system has a v1 (and backfills its features to it).
# This manifest adds forward-looking versions (News Feed's planned v2 = future
# ideas) so the timeline shows the planned-version capability out of the box.
VERSIONS = [
    {"system": "news-feed", "version_num": 2, "label": "Planned v2", "status": "planned",
     "note": "Future ideas — outreach drafts, Dropbox dedup vs existing projects, auto-CRM push."},
]
