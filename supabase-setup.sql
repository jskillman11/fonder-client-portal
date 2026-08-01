-- Fonder Client Portal — Supabase setup
-- Run this once, in the SQL Editor of a fresh Supabase project.
-- Reproduces exactly what was set up for the "Fonder" org's version of this project.

-- Companies: reusable across engagements (a company might have multiple
-- engagements over time).
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  logo_storage_path text, -- path within the public 'engagement-logos' bucket
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

-- Documents: SOW/MSA content, scoped to a company, selectable via dropdown
-- on the engagement setup screen -- independent of any single engagement.
create table documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  doc_type text not null check (doc_type in ('sow', 'msa')),
  title text not null,
  content_markdown text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Engagements: one row per client engagement, linked to a company + client
-- + specific SOW/MSA documents via dropdown selection in the admin UI.
create table engagements (
  id uuid primary key default gen_random_uuid(),
  client_slug text unique not null,
  company_id uuid references companies(id),
  client_id uuid references clients(id),
  sow_document_id uuid references documents(id),
  msa_document_id uuid references documents(id),
  engagement_title text not null,
  total_fee text not null,
  final_delivery_date text not null,
  fonder_signatory_name text not null default 'Tom Abrams',
  fonder_signatory_email text not null default 'tom@fonder.studio',
  document_storage_path text, -- reserved for the final signed PDF (post-signing)
  kickoff_earliest_date date, -- opens the Cal.com scheduling embed to this month by default
  scope_summary text, -- short admin-written scope description for the portal Overview section
  lock_portal_tabs boolean not null default true, -- locks client portal app tabs until docs are sent
  shared_drive_url text, -- per-engagement Google Drive folder link for the Shared Drive tab
  tab_lock_overrides jsonb not null default '{}'::jsonb, -- per-tab lock overrides, keyed by tab key ("locked"/"unlocked"); absent = follow lock_portal_tabs
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Schedule items for the portal Overview section -- start date, deliverable
-- dates, etc. Admin-managed list per engagement.
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

-- Join table: which team members are assigned to which engagement.
create table engagement_team_assignments (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references engagements(id) on delete cascade,
  team_member_id uuid not null references team_members(id) on delete cascade,
  sort_order int not null default 0,
  unique (engagement_id, team_member_id)
);

-- Magic-link access tokens for the client-facing portal.
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

-- Global portal copy: every piece of portal text (welcome greeting/subtitle,
-- team section headings, what's-next steps, review & sign labels), edited
-- once in /admin/content, applied to every client's portal immediately.
-- Template placeholders use {{variableName}} syntax, substituted per-client
-- at render time. Falls back to hardcoded defaults in
-- lib/portal-copy-constants.ts if a key is missing here.
create table portal_copy (
  content_key text primary key,
  content_value text not null,
  updated_at timestamptz not null default now()
);

alter table companies enable row level security;
alter table clients enable row level security;
alter table documents enable row level security;
alter table team_members enable row level security;
alter table engagement_milestones enable row level security;
alter table engagements enable row level security;
alter table engagement_team_assignments enable row level security;
alter table portal_copy enable row level security;
alter table portal_access_tokens enable row level security;

-- Only authenticated users (i.e. logged-in team members) can read/write.
-- The public-facing portal reads through the Next.js server using the service
-- role key, which bypasses RLS entirely, so anonymous/public access is fully
-- locked out here on purpose -- the client-facing app never talks to Supabase
-- directly with a client-side key.
create policy "authenticated users manage companies"
  on companies for all to authenticated using (true) with check (true);

create policy "authenticated users manage clients"
  on clients for all to authenticated using (true) with check (true);

create policy "authenticated users manage documents"
  on documents for all to authenticated using (true) with check (true);

create policy "authenticated users manage engagements"
  on engagements for all to authenticated using (true) with check (true);

create policy "authenticated users manage team members roster"
  on team_members for all to authenticated using (true) with check (true);

create policy "authenticated users manage milestones"
  on engagement_milestones for all to authenticated using (true) with check (true);

create policy "authenticated users manage team assignments"
  on engagement_team_assignments for all to authenticated using (true) with check (true);

create policy "authenticated users manage portal copy"
  on portal_copy for all to authenticated using (true) with check (true);

create policy "authenticated users manage access tokens"
  on portal_access_tokens for all to authenticated using (true) with check (true);

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
