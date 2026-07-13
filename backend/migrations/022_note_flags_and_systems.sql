-- Notes get two upgrades so the board can carry "constant updates":
--  1. A note can now hang on a Live tool (system) as well as a feature card, so
--     every tile on the board — Live / In Progress / Planned — can be flagged.
--  2. Each note is either a FLAG (an admin-raised alarm that turns the project red
--     and floats it to the top) or a plain REPLY a teammate leaves to answer back.
--     Only an admin raises or clears flags; any editor can reply.
alter table project_notes add column if not exists system_id uuid references systems(id) on delete cascade;
alter table project_notes alter column item_id drop not null;
alter table project_notes add column if not exists is_flag boolean not null default false;
-- Every note that predates this change was an admin-raised flag on a feature card.
update project_notes set is_flag = true;
create index if not exists project_notes_system_idx on project_notes (system_id, resolved);
