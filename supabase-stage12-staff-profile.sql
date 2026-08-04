-- Stage 12: staff profile (name + photo). profiles previously only carried
-- role/client_id/is_super_admin -- nothing displayable, so the admin
-- account menu has been showing a name derived from the staff member's
-- email. avatar_storage_path follows the same convention as
-- companies.logo_storage_path: a path within the existing public
-- 'engagement-logos' bucket, resolved to a URL at read time via
-- getPublicUrl() rather than storing an absolute URL.

alter table profiles add column full_name text;
alter table profiles add column avatar_storage_path text;

NOTIFY pgrst, 'reload schema';
