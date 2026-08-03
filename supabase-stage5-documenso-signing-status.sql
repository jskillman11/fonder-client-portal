-- Stage 5: persist real Documenso signing completion on companies, replacing
-- the client-side-only "docsSent" flag (which only meant "a signing session
-- was created," not "the client actually finished signing," and reset on
-- every page refresh since it was never persisted anywhere).
--
-- Run once, in the SQL Editor of the LIVE project (ifddezqyozounhilkfgp).
-- Purely additive, no backfill -- any company that already went through the
-- old ephemeral flow will need to either re-sign via the new embedded flow,
-- or have signed_at backfilled manually via a one-off update if you want to
-- avoid that.

alter table companies add column sow_signed_at timestamptz;
alter table companies add column msa_signed_at timestamptz;
alter table companies add column sow_documenso_document_id text;
alter table companies add column msa_documenso_document_id text;
