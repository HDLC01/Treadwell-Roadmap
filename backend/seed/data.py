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
        "summary": "Live at proposals.wetreadwell.com. Turns a lead into a dollar-accurate estimate "
                   "(Excel) + a branded proposal (Word), saved to Dropbox — with AI autofill.",
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
                 {"title": "Auto-save finished files to the team Dropbox", "status": "live", "division": "admin-it"},
                 {"title": "Added Kansas & Missouri sales-tax lookup", "status": "live", "division": "finance"},
             ]},
            {"layer_type": "basecoat", "title": "Core features", "phase_label": "Core build", "status": "live",
             "items": [
                 {"title": "One-click estimate + proposal, saved to Dropbox", "status": "live", "is_feature": True, "division": "sales-marketing"},
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
            {"layer_type": "topcoat", "title": "Integration", "phase_label": "Hardening", "status": "not_started",
             "items": [
                 {"title": "Custom Claude connector (system → Cowork)", "status": "not_started", "division": "admin-it"},
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
