-- Stage 13: per-brand logo background color. Logos (manual uploads and
-- fetched favicons alike) are now normalized to a fixed canvas with
-- transparent areas flattened onto a solid color -- previously hardcoded
-- to none at all, which let transparent favicon corners show through
-- whatever container background happened to be behind them (e.g. black
-- corners against the dark sidebar switcher). Defaults to white; editable
-- per company so a brand's own color can be used instead if it suits them
-- better than plain white.

alter table companies add column logo_background_color text not null default '#ffffff';

NOTIFY pgrst, 'reload schema';
