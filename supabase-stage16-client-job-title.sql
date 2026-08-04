-- Stage 16: client job title (mirrors profiles.job_title for staff -- see
-- stage 15), shown in the client account menu between name and email.

alter table clients add column job_title text;

NOTIFY pgrst, 'reload schema';
