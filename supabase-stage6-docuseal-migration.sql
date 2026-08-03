-- Stage 6: migrate e-signature provider from Documenso to DocuSeal.
--
-- DocuSeal's webhook payload carries our own external_id (encoded as
-- "companyId:docType") directly on each submitter, so matching a completed
-- webhook back to a company no longer needs a stored id-mapping column +
-- DB lookup the way Documenso required. sow_signed_at/msa_signed_at (from
-- stage 5) are reused unchanged -- they're provider-agnostic.
--
-- Run once, in the SQL Editor of the LIVE project (ifddezqyozounhilkfgp).

alter table companies drop column sow_documenso_document_id;
alter table companies drop column msa_documenso_document_id;
