-- Stage 15: staff job title (e.g. "Global Brand Design Lead"), shown in the
-- account menu between name and email. Named job_title rather than reusing
-- profiles.role, which is the auth-role enum ('staff'/'client') and means
-- something entirely different.

alter table profiles add column job_title text;

NOTIFY pgrst, 'reload schema';
