-- Splits the single brand logo into two independently-managed slots: the
-- login page shows a standalone wide-format logo, while the sidebar needs
-- something that reads well cropped into a small square tile -- one asset
-- rarely suits both (this is why the sidebar was showing a plain black
-- square: the existing wordmark-shaped logo cropped badly at that size).
alter table brand_settings rename column logo_storage_path to login_logo_storage_path;
alter table brand_settings add column sidebar_logo_storage_path text;

-- Seed the new sidebar slot with whatever was already set, so nothing goes
-- blank until the admin uploads a square-friendly mark for it specifically.
update brand_settings set sidebar_logo_storage_path = login_logo_storage_path;
