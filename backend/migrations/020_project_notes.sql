-- Per-project notes: Hanz attaches questions / clarifications / asks to a project.
-- A project with >=1 unresolved note shows a red flag and floats to the top of its
-- division list. Everyone can read; only an admin (Hanz) writes/resolves/deletes.
create table if not exists project_notes (
    id           uuid primary key default gen_random_uuid(),
    item_id      uuid not null references roadmap_items(id) on delete cascade,
    author_email citext not null,
    body         text not null,
    resolved     boolean not null default false,
    created_at   timestamptz not null default now()
);
create index if not exists project_notes_item_idx on project_notes (item_id, resolved);
