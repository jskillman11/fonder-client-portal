-- Stage 3: user management (staff invite/remove, client access revoke) --
-- run once, in the SQL Editor of the LIVE project (ifddezqyozounhilkfgp),
-- against the schema already extended by supabase-stage2-profiles.sql.

alter table profiles add column is_super_admin boolean not null default false;

-- Preserve current behavior for existing staff: everyone who could already
-- do everything still can, until someone deliberately changes it via the
-- new /admin/users page.
update profiles set is_super_admin = true where role = 'staff';
