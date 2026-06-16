-- Feature board: roadmap_items become per-project "features" attached to a system
-- directly (not nested under an epoxy phase). Add system_id, make phase_id optional,
-- and backfill system_id from each item's current phase. Idempotent.
alter table roadmap_items add column if not exists system_id uuid references systems(id) on delete cascade;
alter table roadmap_items alter column phase_id drop not null;
update roadmap_items i
   set system_id = p.system_id
  from phases p
 where p.id = i.phase_id
   and i.system_id is null;
create index if not exists roadmap_items_system_idx on roadmap_items (system_id);
