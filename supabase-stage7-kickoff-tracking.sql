-- Stage 7: persist real kickoff-scheduling completion on companies, so the
-- client portal's global tab unlock can gate on "kickoff actually booked"
-- rather than "documents signed" -- these are now two separate onboarding
-- milestones (see components/WhatsNext.tsx / components/KickoffScheduler.tsx).
--
-- Run once, in the SQL Editor of the LIVE project (ifddezqyozounhilkfgp).

alter table companies add column kickoff_booked_at timestamptz;
