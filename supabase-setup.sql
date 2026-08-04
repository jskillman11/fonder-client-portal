-- Fonder Client Portal — Supabase setup
-- Run this once, in the SQL Editor of a fresh Supabase project.
--
-- This file is kept CURRENT — it reproduces the full schema as it stands
-- today (post stage2 through stage9), not just the original v1 schema.
-- The individual supabase-stage*.sql files remain in the repo as the
-- historical record of how the live project got here incrementally (each
-- already ran against production); this file is what you'd run instead if
-- standing up a brand new project from scratch. If you add a new
-- supabase-stageN file, fold its net effect into this file too so it never
-- drifts back out of date.

-- Companies: a brand/organization, reusable across engagements over time.
-- Holds everything that's a property of the ongoing brand relationship
-- rather than a specific contract: the stable portal routing slug, which
-- SOW/MSA is currently in force, shared drive link, portal tab-lock
-- settings, real e-signature completion, and kickoff-booking completion.
-- companies and documents reference each other (a company points at its
-- in-force sow_document_id/msa_document_id; a document points back at its
-- owning company) -- created without the cross-reference first, then
-- linked via ALTER TABLE below once both tables exist, to avoid a circular
-- forward reference on a fresh database.
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  logo_storage_path text, -- path within the public 'engagement-logos' bucket
  client_slug text unique, -- the stable /portal/[slug] routing key; set once, on a company's first engagement
  lock_portal_tabs boolean not null default true, -- locks client portal app tabs until documents are signed + kickoff booked
  shared_drive_url text, -- Google Drive folder link for the Shared Drive tab
  tab_lock_overrides jsonb not null default '{}'::jsonb, -- per-tab lock overrides, keyed by tab key ("locked"/"unlocked"); absent = follow lock_portal_tabs
  sow_signed_at timestamptz, -- set by the DocuSeal completion webhook once the client actually signs the SOW
  msa_signed_at timestamptz, -- set by the DocuSeal completion webhook once the client actually signs the MSA
  kickoff_booked_at timestamptz, -- set once a real Cal.com kickoff booking completes
  kickoff_start_time timestamptz, -- the booked meeting's start time, for display
  qb_customer_id text, -- this company's QuickBooks Customer id, reusable across engagements
  created_at timestamptz not null default now()
);

-- Clients: an actual person, belonging to a company. A company can have
-- multiple clients (contacts); an engagement picks one as its signatory.
create table clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

-- Documents: SOW/MSA content, scoped to a company, reusable across
-- engagements -- a company's currently-in-force SOW/MSA is selected via
-- companies.sow_document_id/msa_document_id, added below.
create table documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  doc_type text not null check (doc_type in ('sow', 'msa')),
  title text not null,
  content_markdown text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table companies add column sow_document_id uuid references documents(id); -- which SOW is currently in force
alter table companies add column msa_document_id uuid references documents(id); -- which MSA is currently in force

-- Engagements: a lean historical record of one contract period. A company
-- can only ever have one 'active' engagement at a time (enforced by the
-- partial unique index below) -- team, documents-in-force, shared drive,
-- and portal-lock settings all live on companies instead, since they're
-- properties of the ongoing brand relationship, not a specific contract.
create table engagements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  client_id uuid references clients(id), -- the stakeholder/signatory for this engagement
  engagement_title text not null,
  total_fee text not null,
  total_fee_amount numeric(12, 2), -- structured numeric fee, alongside the free-text display string above -- feeds real QuickBooks invoice creation
  final_delivery_date text not null,
  fonder_signatory_name text not null default 'Tom Abrams',
  fonder_signatory_email text not null default 'tom@fonder.studio',
  document_storage_path text, -- reserved for the final signed PDF (post-signing)
  kickoff_earliest_date date, -- opens the Cal.com scheduling embed to this month by default
  scope_summary text, -- short admin-written scope description for the portal Overview section
  status text not null default 'active' check (status in ('active', 'completed')),
  qb_invoice_id text, -- this engagement's QuickBooks Invoice id, once created
  qb_invoice_link text, -- QuickBooks' own hosted pay-page URL for that invoice
  invoice_sent_at timestamptz, -- set when an admin creates/sends the invoice
  invoice_paid_at timestamptz, -- set by the QuickBooks webhook once Invoice.Balance === 0
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index engagements_one_active_per_company
  on engagements(company_id) where status = 'active';

-- Schedule items for the portal Overview section -- start date, deliverable
-- dates, etc. Admin-managed list per engagement (this one thing does stay
-- per-contract, unlike team/documents/drive/locks above).
create table engagement_milestones (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references engagements(id) on delete cascade,
  label text not null,
  milestone_date date not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Team members: Fonder's own staff, as a reusable global roster.
create table team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  icon_bg_color text,
  icon_text_color text,
  created_at timestamptz not null default now()
);

-- Join table: which team members are the standing "account team" for a
-- company. Company-scoped, not engagement-scoped -- no history is kept of
-- who was staffed on a specific past engagement, by design.
create table company_team_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  team_member_id uuid not null references team_members(id) on delete cascade,
  sort_order int not null default 0,
  unique (company_id, team_member_id)
);

-- Real Supabase Auth role for both staff and clients -- the single source
-- of truth for "who is this and what can they do." client_id is set only
-- for role = 'client', linking back to the clients table.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('staff', 'client')),
  client_id uuid references clients(id) on delete cascade,
  is_super_admin boolean not null default false, -- only super-admins can invite/remove/promote staff
  created_at timestamptz not null default now()
);

-- Dead table, unused -- superseded by real Supabase Auth
-- (auth.admin.generateLink/verifyOtp). Kept as a rollback path; safe to
-- drop in a future cleanup pass.
create table portal_access_tokens (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references engagements(id) on delete cascade,
  email text not null,
  token text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index portal_access_tokens_token_idx on portal_access_tokens(token);

-- Global portal copy: every piece of client-facing text (welcome
-- greeting/subtitle, team section headings, what's-next steps, review &
-- sign labels), edited once in /admin/settings/content, applied to every
-- client's portal immediately. Template placeholders use {{variableName}}
-- syntax, substituted per-client at render time. Falls back to hardcoded
-- defaults in lib/portal-copy-constants.ts if a key is missing here.
create table portal_copy (
  content_key text primary key,
  content_value text not null,
  updated_at timestamptz not null default now()
);

-- Singleton: exactly one QuickBooks connection for the whole app (Fonder's
-- own company, not one per client -- doesn't fit lib/company-settings.ts's
-- per-company pattern). Service-role only; RLS is enabled with NO policies
-- at all (see the RLS block below), same trust boundary as profiles/
-- portal_access_tokens -- never read via the anon/publishable key.
create table quickbooks_connection (
  id boolean primary key default true check (id), -- singleton trick: only one row can ever exist
  environment text not null default 'sandbox' check (environment in ('sandbox', 'production')),
  realm_id text not null,
  access_token text not null,
  refresh_token text not null,
  access_token_expires_at timestamptz not null,
  refresh_token_expires_at timestamptz not null,
  connected_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table companies enable row level security;
alter table clients enable row level security;
alter table documents enable row level security;
alter table team_members enable row level security;
alter table engagement_milestones enable row level security;
alter table engagements enable row level security;
alter table company_team_assignments enable row level security;
alter table portal_copy enable row level security;
alter table portal_access_tokens enable row level security;
alter table profiles enable row level security;
alter table quickbooks_connection enable row level security; -- deliberately no policies -- service-role only

-- Only real staff (profiles.role = 'staff') can read/write these tables.
-- The public-facing portal reads through the Next.js server using the
-- service role key, which bypasses RLS entirely, so anonymous/public
-- access is fully locked out here on purpose -- the client-facing app
-- never talks to Supabase directly with a client-side key.
create policy "staff manage companies" on companies for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));

create policy "staff manage clients" on clients for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));

create policy "staff manage documents" on documents for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));

create policy "staff manage engagements" on engagements for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));

create policy "staff manage team members roster" on team_members for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));

create policy "staff manage milestones" on engagement_milestones for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));

create policy "staff manage company team assignments" on company_team_assignments for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));

create policy "staff manage portal copy" on portal_copy for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));

create policy "staff manage access tokens" on portal_access_tokens for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));

-- Users can read their own profile (needed so both admin and portal server
-- code can look up "who is this and what's their role" via the user's own
-- session). No client-side insert/update policy -- profiles are only ever
-- written by service-role server code.
create policy "users read own profile"
  on profiles for select to authenticated using (id = auth.uid());

-- Storage bucket for the final signed-ready PDFs. Private (not public) --
-- only accessed server-side via the service role key.
insert into storage.buckets (id, name, public)
values ('engagement-documents', 'engagement-documents', false);

-- Public bucket for client/company logos, shown co-branded alongside the
-- Fonder logo on the portal. Public is fine here (unlike the SOW/MSA bucket
-- above) -- a logo isn't sensitive, and public buckets serve directly via a
-- CDN URL without needing extra read policies.
insert into storage.buckets (id, name, public)
values ('engagement-logos', 'engagement-logos', true);

NOTIFY pgrst, 'reload schema';
