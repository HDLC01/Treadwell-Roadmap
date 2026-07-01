-- Priority star: flag a card as "we want to do this next" so it floats to the
-- top of its board. priority_set_at gives a stable tie-break among starred cards.
alter table roadmap_items add column if not exists priority boolean not null default false;
alter table roadmap_items add column if not exists priority_set_at timestamptz;
