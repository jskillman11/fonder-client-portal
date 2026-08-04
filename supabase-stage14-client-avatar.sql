-- Stage 14: client profile photo. clients previously only carried
-- first_name/last_name/email -- no photo. avatar_storage_path follows the
-- same convention as profiles.avatar_storage_path and
-- companies.logo_storage_path: a path within the existing public
-- 'engagement-logos' bucket, resolved to a URL at read time via
-- getPublicUrl().

alter table clients add column avatar_storage_path text;

NOTIFY pgrst, 'reload schema';
