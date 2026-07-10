-- Three-tier roles (admin / member / viewer) + per-user notification read-state.
--
-- Old model was binary (admin/viewer) where "viewer" could actually edit. New
-- model: admin (full + dashboard), member (view + edit projects — the default),
-- viewer (read-only). Widen the role check, flip the default to 'member', and
-- backfill existing 'viewer' rows to 'member' so nobody loses the edit access
-- they already had. True read-only 'viewer' is now assigned explicitly by an
-- admin; this ledger-tracked file runs once, so future viewers aren't touched.
alter table users drop constraint if exists users_role_chk;
alter table users add constraint users_role_chk check (role in ('admin','member','viewer'));
alter table users alter column role set default 'member';
update users set role = 'member' where role = 'viewer';

-- Notification bell: a per-user "seen" watermark over the activity log. Unread =
-- activity newer than this timestamp (and not authored by the user themselves).
alter table users add column if not exists notifications_seen_at timestamptz;
