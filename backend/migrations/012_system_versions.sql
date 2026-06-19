-- Per-system version timeline (v1, v2, planned v3 …). Each version groups a set
-- of features; planned versions capture future ideas. Drill-down: system →
-- version → features. Idempotent.
create table if not exists system_versions (
    id          uuid primary key default gen_random_uuid(),
    system_id   uuid not null references systems(id) on delete cascade,
    version_num int  not null,
    label       text not null,
    status      text not null default 'planned',
    note        text,
    ordering    int  not null default 0,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    unique (system_id, version_num)
);

do $$ begin
    if not exists (select 1 from pg_constraint where conname = 'system_versions_status_chk') then
        alter table system_versions add constraint system_versions_status_chk
            check (status in ('live', 'in_progress', 'planned', 'not_started'));
    end if;
end $$;

create index if not exists system_versions_system_ordering_idx on system_versions (system_id, ordering);

-- updated_at trigger (reuse the shared function from 008_triggers.sql).
drop trigger if exists trg_set_updated_at on system_versions;
create trigger trg_set_updated_at before update on system_versions
    for each row execute function set_updated_at();

-- Tag each feature/item with the version it belongs to (nullable; null = legacy/
-- unversioned). on delete set null so removing a version never deletes its items.
alter table roadmap_items add column if not exists version_id uuid references system_versions(id) on delete set null;
create index if not exists roadmap_items_version_idx on roadmap_items (version_id);
