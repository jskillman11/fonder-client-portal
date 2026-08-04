-- Stage 10: move signing-completion and kickoff-booking state from
-- companies to engagements. These were company-scoped from an earlier
-- design stage (treated as ongoing brand-relationship state, like
-- docs-in-force), but that's wrong once a company has more than one
-- engagement over time -- a brand new engagement was inheriting
-- "already signed"/"already booked" from a previous, unrelated engagement.
-- kickoff_earliest_date is already engagement-scoped; this brings
-- booked_at/start_time in line with it, and makes signing-completion match
-- the same per-contract lifecycle invoicing already uses.

alter table engagements add column sow_signed_at timestamptz;
alter table engagements add column msa_signed_at timestamptz;
alter table engagements add column kickoff_booked_at timestamptz;
alter table engagements add column kickoff_start_time timestamptz;

-- Migrate existing company-level state onto each company's current active
-- engagement (there's at most one, per engagements_one_active_per_company)
-- rather than silently losing already-real signed/booked state.
update engagements e
set sow_signed_at = c.sow_signed_at,
    msa_signed_at = c.msa_signed_at,
    kickoff_booked_at = c.kickoff_booked_at,
    kickoff_start_time = c.kickoff_start_time
from companies c
where e.company_id = c.id and e.status = 'active';

alter table companies drop column sow_signed_at;
alter table companies drop column msa_signed_at;
alter table companies drop column kickoff_booked_at;
alter table companies drop column kickoff_start_time;

NOTIFY pgrst, 'reload schema';
