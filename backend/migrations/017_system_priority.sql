-- Priority star on floors too (systems/divisions), so a Live tool card can be
-- starred and float to the top of the list — same idea as roadmap_items.priority.
alter table systems add column if not exists priority boolean not null default false;
alter table systems add column if not exists priority_set_at timestamptz;
