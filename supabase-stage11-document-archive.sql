-- Stage 11: signed-document archive. document_storage_path was reserved
-- scaffolding from an earlier stage -- confirmed dead, never written
-- anywhere, and can't represent two independently-signed documents (SOW
-- and MSA) anyway. Replaced with one path per doc type, set once
-- DocuSeal's submission.completed webhook fires (both Client and Fonder
-- have signed) and the fully-executed PDF is fetched and stored.

alter table engagements drop column document_storage_path;

alter table engagements add column sow_signed_document_path text;
alter table engagements add column msa_signed_document_path text;

NOTIFY pgrst, 'reload schema';
