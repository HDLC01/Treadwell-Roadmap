-- Phases — the epoxy layers per system (grind -> cure), mapped to software phases.
create table if not exists phases (
    id           uuid primary key default gen_random_uuid(),
    system_id    uuid not null references systems(id) on delete cascade,
    layer_type   text not null,    -- grind | repair | clean | primer | basecoat | topcoat | cure
    title        text not null,
    phase_label  text,             -- software-phase caption, e.g. 'Discovery & Requirements'
    detail       text,
    status       text not null default 'planned',
    ordering     int  not null default 0,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

do $$ begin
    if not exists (select 1 from pg_constraint where conname = 'phases_layer_chk') then
        alter table phases add constraint phases_layer_chk
            check (layer_type in ('grind','repair','clean','primer','basecoat','topcoat','cure'));
    end if;
    if not exists (select 1 from pg_constraint where conname = 'phases_status_chk') then
        alter table phases add constraint phases_status_chk
            check (status in ('live','in_progress','planned','not_started'));
    end if;
end $$;

create index if not exists phases_system_ordering_idx on phases (system_id, ordering);
