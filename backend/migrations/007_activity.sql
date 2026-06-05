-- Activity — lightweight audit log of edits + logins.
create table if not exists activity (
    id           bigint generated always as identity primary key,
    actor_email  citext,
    action       text not null,      -- created|updated|deleted|reordered|login|status_change
    entity_type  text not null,      -- system|phase|roadmap_item|doc_page|user
    entity_id    text,
    detail       jsonb not null default '{}'::jsonb,
    created_at   timestamptz not null default now()
);

create index if not exists activity_created_idx on activity (created_at desc);
create index if not exists activity_entity_idx  on activity (entity_type, entity_id);
