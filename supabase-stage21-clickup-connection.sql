-- Single-tenant ClickUp integration -- one Personal API Token for Fonder's
-- own shared ClickUp workspace, same singleton trick as quickbooks_connection.
create table clickup_connection (
  id boolean primary key default true check (id),
  api_token text not null,
  connected_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table clickup_connection enable row level security; -- deliberately no policies -- service-role only

NOTIFY pgrst, 'reload schema';
