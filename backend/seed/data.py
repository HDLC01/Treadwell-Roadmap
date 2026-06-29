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

    # ===================== SYSTEM: PROFILES (Cloud Accountant Staffing — external) =====================
    {
        "slug": "profiles", "name": "Profiles — Cloud Accountant Staffing", "kind": "system",
        "status": "in_progress", "accent": "#6366F1", "ordering": 9,
        "summary": "External build for Will's other company, Cloud Accountant Staffing (billed separately). "
                   "A candidate portal where clients browse offshore accounting candidates, read in-depth "
                   "profiles, build a shortlist, and book an interview. Target: profiles.wetreadwell.com.",
        "phases": [
            {"layer_type": "grind", "title": "Discovery", "phase_label": "Discovery", "status": "live",
             "items": [
                 {"title": "Walked through the reference portal to learn the experience", "status": "live"},
                 {"title": "Mapped the candidate profile (skills, software, assessments, details)", "status": "live"},
                 {"title": "Chose the build: Next.js + Clerk sign-in + a secure database", "status": "live"},
             ]},
            {"layer_type": "clean", "title": "Setup", "phase_label": "Setup", "status": "live",
             "items": [
                 {"title": "Created the project + code repository", "status": "live"},
                 {"title": "Set up Clerk sign-in and confirmed it works", "status": "live", "is_feature": True},
                 {"title": "Reserved hosting + the address profiles.wetreadwell.com", "status": "live"},
             ]},
            {"layer_type": "primer", "title": "Foundation", "phase_label": "Foundation", "status": "live",
             "items": [
                 {"title": "Built the secure database + candidate data model", "status": "live", "is_feature": True},
                 {"title": "Every request is checked against Clerk sign-in", "status": "live"},
                 {"title": "Staff vs client roles — clients only see published candidates", "status": "live", "is_feature": True},
                 {"title": "Editable lists of skills, software & assessments", "status": "live"},
                 {"title": "Original branded interface (Ledgerline)", "status": "live", "is_feature": True},
                 {"title": "Automated tests, CI pipeline & staging branch", "status": "live"},
             ]},
            {"layer_type": "basecoat", "title": "Core build", "phase_label": "Core build", "status": "live",
             "items": [
                 {"title": "Browse candidates with search, sort & filters", "status": "live", "is_feature": True},
                 {"title": "In-depth candidate profiles (about, assessments, skills, software)", "status": "live", "is_feature": True},
                 {"title": "Build a shortlist + book an interview", "status": "live", "is_feature": True},
                 {"title": "Staff add & edit candidates through an intake form", "status": "live", "is_feature": True},
                 {"title": "Personality type links to the Treadwell Assess result", "status": "live"},
                 {"title": "Standardized resume — auto-generated or uploaded", "status": "live", "is_feature": True},
             ]},
            {"layer_type": "topcoat", "title": "Media & Launch", "phase_label": "Media & Launch", "status": "planned",
             "items": [
                 {"title": "Profile photos + intro videos", "status": "planned"},
                 {"title": "Packaged for the server + secure web address", "status": "planned"},
             ]},
            {"layer_type": "cure", "title": "Live", "phase_label": "Live", "status": "not_started",
             "items": [
                 {"title": "Live at profiles.wetreadwell.com", "status": "not_started"},
                 {"title": "End-to-end tested across desktop + mobile", "status": "not_started"},
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

# Kyle's note: after an estimate is drafted it passes through several hands before
# it becomes a scheduled job — each hand-off is an automation opportunity.
_SUB_HANDOFF = (
    "General idea: after an estimate is drafted it passes through several hands before it becomes a "
    "scheduled job — and each hand-off is a chance to automate (less re-entry, fewer dropped balls). "
    "Worth mapping out and automating the in-between steps. Rough stages it moves through:\n\n"
    "### Hand-off steps to look at\n"
    "1. Estimate review & approval\n"
    "2. Proposal sent to the customer\n"
    "3. Customer decision / deposit\n"
    "4. Won → hand-off sheet\n"
    "5. Set up in Foundation + Raken\n"
    "6. PM assignment + scheduling\n\n"
    "*General idea for now — details to be filled in as the process gets mapped out.*\n"
)

# ── Recent Proposal & Estimate Tool work (currently on staging, pending prod) ──
_SUB_CRM_PIPELINE = (
    "A read-only CRM pipeline view built into the tool that pulls projects from Basisboard, so the "
    "sales pipeline shows up right alongside the estimates.\n\n"
    "### Sub-process\n"
    "1. Pulls the project list from Basisboard (via its API) and lays them out as a pipeline board.\n"
    "2. Smooth horizontal scroll + mouse-wheel scrolling across the columns.\n"
    "3. Loads fast — parallel fetch with an instant-paint cache, so it isn't a blank wait.\n"
    "4. **Next:** promote from staging to the live tool.\n"
)
_SUB_PROPOSAL_POLISH = (
    "A round of proposal-quality fixes from Kyle's review, so the generated proposal looks and reads "
    "exactly right.\n\n"
    "### Sub-process\n"
    "1. The on-screen price preview now matches the generated Word doc to the dollar.\n"
    "2. PRICE blocks: bold headers, left-aligned, per-room layout.\n"
    "3. PDF export bundles the Zetta Serif font so the PDF matches the Word doc.\n"
    "4. Editable NOTES section; exclusions now carry through into the doc.\n"
    "5. Tax-exempt + no-site-visit wording extended to polish/combo; cove-base height; correct \"Kansas Remodel Tax\" wording.\n"
    "6. **Next:** promote from staging to the live tool.\n"
)
_SUB_PROPOSAL_SECURITY = (
    "Security hardening pass on the tool.\n\n"
    "### Sub-process\n"
    "1. Escaped cross-site-scripting (XSS) sinks in the UI.\n"
    "2. Stopped leaking internal error detail to the browser.\n"
    "3. Validate spreadsheet cell addresses before they're used.\n"
    "4. **Next:** promote from staging to the live tool.\n"
)

# ── Customer Proposal Portal — BUILT, live to preview on staging (Jun 2026) ─────
_SUB_PORTAL_CORE = (
    "The customer side of the proposal flow — a standalone portal where the customer views their "
    "proposal, asks questions, and approves, instead of going back and forth over email.\n\n"
    "### Status: built — live to preview on staging\n"
    "A working version is up at **staging.portal.wetreadwell.com** (preview, not yet turned on for "
    "real customers). It reads proposals from the proposal tool, so there's one source of truth.\n\n"
    "### How it works\n"
    "1. The customer opens a secure link, or signs in with **Google or a one-time email code**, to "
    "see their proposal.\n"
    "2. On the page they view the proposal and pricing options, ask questions, and approve.\n"
    "3. **Approve Proposal** captures Name, Title, Date, and which option / total was accepted.\n"
    "4. On approval, notify Kyle, Dane, RJ, and bids@wetreadwell.com.\n\n"
    "### Next\n"
    "The staff side (a \"Send to customer portal\" button + a pipeline view inside the proposal tool), "
    "then turning it on for real customers in production.\n"
)
_SUB_PORTAL_LOGIN = (
    "How customers get into the portal — an account login, so they don't have to wait for a link.\n\n"
    "### Built\n"
    "1. Sign in with **Google**, or with a **one-time code emailed** to them.\n"
    "2. They then see the project(s) tied to their email.\n"
    "3. If their email has no project: \"You don't have an existing project with this email.\"\n\n"
    "*Live to preview on staging. Google sign-in turns on once a Google client ID is set; the "
    "email-code path works today.*\n"
)
_SUB_PORTAL_QA = (
    "Every proposal question and answer stays attached to the proposal — never trapped in one "
    "person's inbox.\n\n"
    "### Built\n"
    "1. The customer posts questions on the proposal page.\n"
    "2. The team is notified (Kyle, Dane, RJ, bids@wetreadwell.com).\n"
    "3. The team replies through the system; the customer is emailed that a reply was posted and "
    "returns to the page to read and respond.\n"
    "4. The full thread is visible to authorized Treadwell users.\n\n"
    "*Live to preview on staging. Customer side done; staff replies happen on the admin side (in the "
    "proposal tool), which is next.*\n"
)
_SUB_PORTAL_AUTOMATIONS = (
    "When a proposal is approved, kick off project setup automatically instead of by hand.\n\n"
    "### Built (MVP)\n"
    "1. **Dropbox** — create the project folder on approval (turns on once Dropbox keys are set).\n"
    "2. Notify the team and record the approval.\n\n"
    "### Phase 2\n"
    "3. **Basis Board** — write the status to Approved (the current Basis Board link is read-only, so "
    "this needs its write API).\n"
    "4. **Foundation Software** — create the new project.\n"
    "5. **Operations hand-off** — auto-create the project hand-off sheet (overlaps the Operations "
    "\"Estimate → job hand-off automation\" card).\n"
)
_SUB_PORTAL_STATUS = (
    "After approval, the customer sees a simple status page — three lines, nothing more.\n\n"
    "### Built\n"
    "1. **Proposal** — Pending → Approved\n"
    "2. **Deposit** — Pending → Received\n"
    "3. **Schedule** — Pending → Scheduled\n\n"
    "*Live to preview on staging. Updates automatically as staff mark deposit/scheduled (those staff "
    "controls live on the admin side, which is next).*\n"
)
_SUB_PORTAL_DEPOSIT = (
    "After approval, the customer sees how to pay the deposit and it tracks to Received.\n\n"
    "### Built\n"
    "1. Deposit instructions with two options: ACH or check.\n"
    "2. **ACH** — the customer submits an ACH form; the team is notified (Kyle, Dane, RJ, Kyleene, "
    "bids@wetreadwell.com). We store only the last 4 digits — never the full account number.\n"
    "3. **Check** — show the check mailing instructions.\n"
    "4. Deposit stays **Pending** until confirmed internally, then flips to **Received**.\n\n"
    "*Live to preview on staging. Exact ACH / check instructions to be provided.*\n"
)
_SUB_PORTAL_SCHEDULE = (
    "The customer's schedule status updates automatically once the job is scheduled.\n\n"
    "### Built\n"
    "1. Schedule stays **Pending** until scheduling is completed internally.\n"
    "2. When staff mark it scheduled, the customer status page flips to **Scheduled**.\n\n"
    "*Live to preview on staging. The staff \"mark scheduled\" control lives on the admin side (next); "
    "syncing it with Basis Board is Phase 2.*\n"
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
    {"system": "operations", "status": "in_progress", "title": "Estimate → job hand-off automation", "detail": _SUB_HANDOFF},
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

    # ===================== PROPOSAL & ESTIMATE TOOL (recent work — on staging, pending prod) =====================
    {"system": "proposal-tool", "status": "in_progress", "title": "Basisboard CRM pipeline view", "detail": _SUB_CRM_PIPELINE},
    {"system": "proposal-tool", "status": "in_progress", "title": "Proposal quality refinements (Kyle's feedback)", "detail": _SUB_PROPOSAL_POLISH},
    {"system": "proposal-tool", "status": "in_progress", "title": "Security hardening", "detail": _SUB_PROPOSAL_SECURITY},

    # ----- Customer Proposal Portal (built — live to preview on staging.portal.wetreadwell.com) -----
    {"system": "proposal-tool", "status": "in_progress", "title": "Customer Proposal Portal — view & approve (no more email approvals)", "detail": _SUB_PORTAL_CORE},
    {"system": "proposal-tool", "status": "in_progress", "title": "Customer sign-in (Google + email code)", "detail": _SUB_PORTAL_LOGIN},
    {"system": "proposal-tool", "status": "in_progress", "title": "In-proposal Q&A thread", "detail": _SUB_PORTAL_QA},
    {"system": "proposal-tool", "status": "in_progress", "title": "Approval automations → Dropbox (Basis Board phase 2)", "detail": _SUB_PORTAL_AUTOMATIONS},
    {"system": "proposal-tool", "status": "in_progress", "title": "Customer status page (Proposal · Deposit · Schedule)", "detail": _SUB_PORTAL_STATUS},
    {"system": "proposal-tool", "status": "in_progress", "title": "Deposit workflow (ACH / check)", "detail": _SUB_PORTAL_DEPOSIT},
    {"system": "proposal-tool", "status": "in_progress", "title": "Scheduling workflow (status auto-updates)", "detail": _SUB_PORTAL_SCHEDULE},
]


# ── Version-timeline entries BEYOND the auto-seeded v1. ──
# _seed_versions ensures every system has a v1 (and backfills its features to it).
# This manifest adds forward-looking versions (News Feed's planned v2 = future
# ideas) so the timeline shows the planned-version capability out of the box.
VERSIONS = [
    {"system": "news-feed", "version_num": 2, "label": "Planned v2", "status": "planned",
     "note": "Future ideas — outreach drafts, Dropbox dedup vs existing projects, auto-CRM push."},
]
