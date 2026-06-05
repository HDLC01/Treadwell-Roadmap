-- "Floors" — every top-level flooring project: the master overview, the shipped
-- software SYSTEMS (Proposal Tool, News Feed), and the business DIVISIONS
-- (Operations, Finance, ...). All share one epoxy-floor renderer; `kind` tells
-- them apart. (Table is named `systems` for brevity; conceptually these are floors.)
create table if not exists systems (
    id          uuid primary key default gen_random_uuid(),
    slug        text not null unique,
    name        text not null,
    summary     text,
    kind        text not null default 'system',   -- 'overview' | 'system' | 'division'
    status      text not null default 'planned',  -- live | in_progress | planned | not_started
    accent      text,                             -- hex accent for the epoxy theme
    ordering    int  not null default 0,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

do $$ begin
    if not exists (select 1 from pg_constraint where conname = 'systems_kind_chk') then
        alter table systems add constraint systems_kind_chk check (kind in ('overview','system','division'));
    end if;
    if not exists (select 1 from pg_constraint where conname = 'systems_status_chk') then
        alter table systems add constraint systems_status_chk
            check (status in ('live','in_progress','planned','not_started'));
    end if;
end $$;

create index if not exists systems_ordering_idx on systems (ordering);
-- At most one overview row.
create unique index if not exists systems_one_overview_idx on systems (kind) where kind = 'overview';
