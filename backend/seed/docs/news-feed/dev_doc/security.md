# Cybersecurity — News Feed

## Legal & ethical scraping (the golden rule)

- **Never scrape LinkedIn.** Profile URLs are resolved via a legal **search API**
  (Brave/SerpAPI), never by hitting LinkedIn behind its login wall.
- Respect `robots.txt` + ToS; descriptive User-Agent; per-host rate limiting.
- Every contact stores its `source_url`; a `do_not_contact` flag is honored.

## Secrets & access

- All secrets live only in `/opt/treadwell-newsfeed/.env` (gitignored): Supabase
  service-role key, Resend API key, the search API key, and (historically) a Management
  PAT used once for migrations.
- The **service-role key never reaches the browser**; the SPA reads through the API.
- The container binds **loopback only**; nginx is the sole public surface (HTTPS via certbot).

## Outreach safety

- **AI drafts, humans decide.** There is deliberately **no batch-send** endpoint —
  outreach is one-at-a-time with human approval (Phase 2).
- The daily email is transactional (Resend) from a verified sending subdomain
  (`notify.wetreadwell.com`, SPF/DKIM/DMARC).

## Operational safety

- A **kill switch** (`nf-down`) can take the public site down instantly if needed.
- The pipeline holds a DB **run-lock** so a manual run can't collide with the scheduled one.
- Open hardening item: rotate the VPS root password (shared-host task, tracked).
