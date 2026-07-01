-- Site-wide notice bar for updates. Single row (id=1), admin-editable; shown
-- across the top of every page to anyone signed in.
create table if not exists site_notice (
    id         int primary key default 1 check (id = 1),
    message    text not null default '',
    level      text not null default 'info',
    active     boolean not null default false,
    updated_by text,
    updated_at timestamptz not null default now()
);
insert into site_notice (id, message, active) values (1, '', false)
on conflict (id) do nothing;
