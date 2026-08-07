-- Singleton row for Fonder's own admin-dashboard brand logo (distinct from
-- companies.logo_storage_path, which is per-client-company). Same "only one
-- row can ever exist" trick as quickbooks_connection.
create table brand_settings (
  id boolean primary key default true check (id),
  logo_storage_path text,
  updated_at timestamptz not null default now()
);

alter table brand_settings enable row level security;

create policy "staff manage brand settings" on brand_settings for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));

NOTIFY pgrst, 'reload schema';
