-- Stage 8: persist the actual booked kickoff meeting time, so the portal can
-- show "Meeting booked for [date/time]" instead of just a boolean, once
-- kickoff_booked_at (stage 7) is set.
--
-- Run once, in the SQL Editor of the LIVE project (ifddezqyozounhilkfgp).

alter table companies add column kickoff_start_time timestamptz;
