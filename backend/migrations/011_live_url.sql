-- Public URL of the deployed system (e.g. https://proposals.wetreadwell.com).
-- Nullable — only live systems with a public site have one. Powers the
-- "Visit live site" button on the overview card + the system detail page. Idempotent.
alter table systems add column if not exists live_url text;
