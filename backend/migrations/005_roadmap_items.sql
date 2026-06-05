-- Roadmap items — the tasks inside each phase. is_feature => renders as a flake.
-- Every task is also tagged with the business DIVISION it belongs to
-- (Operations / Finance / ...), which is itself a floor (systems row, kind='division').
create table if not exists roadmap_items (
    id          uuid primary key default gen_random_uuid(),
    phase_id    uuid not null references phases(id) on delete cascade,
    division_id uuid references systems(id) on delete set null,  -- the Division this task fits in
    title       text not null,
    detail      text,
    status      text not null default 'planned',  -- live | in_progress | planned | not_started
    is_feature  boolean not null default false,
    ordering    int  not null default 0,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

do $$ begin
    if not exists (select 1 from pg_constraint where conname = 'roadmap_items_status_chk') then
        alter table roadmap_items add constraint roadmap_items_status_chk
            check (status in ('live','in_progress','planned','not_started'));
    end if;
end $$;

create index if not exists roadmap_items_phase_ordering_idx on roadmap_items (phase_id, ordering);
create index if not exists roadmap_items_division_idx on roadmap_items (division_id);
