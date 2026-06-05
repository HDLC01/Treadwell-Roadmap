-- Doc pages — SOPs (user how-to) + developer documentation, markdown bodies.
create table if not exists doc_pages (
    id             uuid primary key default gen_random_uuid(),
    system_id      uuid not null references systems(id) on delete cascade,
    kind           text not null,        -- 'sop' | 'dev_doc'
    section        text,                 -- dev_doc: codebase|architecture|devops|security|pipelines|agentic|scalability
    slug           text not null,
    title          text not null,
    body_markdown  text not null default '',
    ordering       int  not null default 0,
    updated_by     uuid references users(id) on delete set null,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

do $$ begin
    if not exists (select 1 from pg_constraint where conname = 'doc_pages_kind_chk') then
        alter table doc_pages add constraint doc_pages_kind_chk check (kind in ('sop','dev_doc'));
    end if;
end $$;

create unique index if not exists doc_pages_system_kind_slug_idx on doc_pages (system_id, kind, slug);
create index if not exists doc_pages_system_kind_ordering_idx on doc_pages (system_id, kind, ordering);
