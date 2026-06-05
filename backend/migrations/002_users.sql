-- Users — identity comes from Treadwell's Supabase/Google sign-in; this table
-- holds only the local ROLE + status, keyed by email (auto-provisioned on first
-- login). password_hash is unused/nullable (kept for an optional local fallback).
create table if not exists users (
    id             uuid primary key default gen_random_uuid(),
    email          citext not null unique,
    password_hash  text,
    full_name      text,
    role           text not null default 'viewer',
    status         text not null default 'active',
    last_login_at  timestamptz,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

do $$ begin
    if not exists (select 1 from pg_constraint where conname = 'users_role_chk') then
        alter table users add constraint users_role_chk check (role in ('admin','viewer'));
    end if;
    if not exists (select 1 from pg_constraint where conname = 'users_status_chk') then
        alter table users add constraint users_status_chk check (status in ('active','disabled'));
    end if;
end $$;

create index if not exists users_role_idx on users (role);
