-- Default new users to read-only 'viewer' (was 'member' in 018).
--
-- New @wetreadwell.com sign-ins should land as view-only until an admin promotes
-- them to member (edit) or admin. resolve_user / admin.create_user / bootstrap_admin
-- all specify a role explicitly, so this column default is only a fallback — kept in
-- sync with the code default for a self-consistent schema. 018 already ran (ledger
-- applies each file once), so its 'member' default is changed here rather than edited.
alter table users alter column role set default 'viewer';
