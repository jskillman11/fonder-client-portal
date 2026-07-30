-- Fonder Client Portal — Supabase setup
-- Run this once, in the SQL Editor of a fresh Supabase project.
-- Reproduces exactly what was set up for the "Fonder" org's version of this project.

-- Engagements: one row per client, replacing the hand-edited lib/engagements.ts
create table engagements (
  id uuid primary key default gen_random_uuid(),
  client_slug text unique not null,
  client_name text not null,
  engagement_title text not null,
  total_fee text not null,
  final_delivery_date text not null,
  client_signatory_name text not null,
  client_signatory_first_name text,
  client_signatory_last_name text,
  client_signatory_email text not null,
  fonder_signatory_name text not null default 'Tom Abrams',
  fonder_signatory_email text not null default 'tom@fonder.studio',
  next_steps text, -- null = use the generic default copy
  document_storage_path text, -- path within the 'engagement-documents' storage bucket
  client_logo_storage_path text, -- path within the public 'engagement-logos' bucket, for co-branding
  sow_content_markdown text, -- SOW body content in Markdown, rendered natively + converted to PDF at sign-time
  msa_content_markdown text, -- MSA body content, same treatment
  transcript text, -- raw scoping call transcript, kept for reference only
  notes text, -- free-form notes, kept for reference only
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Team members shown in the portal's "Your team" section, one client can have many
create table engagement_team_members (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references engagements(id) on delete cascade,
  name text not null,
  role text not null,
  blurb text,
  icon_bg_color text,
  icon_text_color text,
  sort_order int not null default 0
);

alter table engagements enable row level security;
alter table engagement_team_members enable row level security;

-- Only authenticated users (i.e. logged-in team members) can read/write.
-- The public-facing portal reads through the Next.js server using the service
-- role key, which bypasses RLS entirely, so anonymous/public access is fully
-- locked out here on purpose -- the client-facing app never talks to Supabase
-- directly with a client-side key.
create policy "authenticated users manage engagements"
  on engagements for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users manage team members"
  on engagement_team_members for all
  to authenticated
  using (true)
  with check (true);

-- Global portal copy, edited once, applied to every client portal.
create table portal_copy (
  content_key text primary key,
  content_value text not null,
  updated_at timestamptz not null default now()
);

alter table portal_copy enable row level security;

create policy "authenticated users manage portal copy"
  on portal_copy for all
  to authenticated
  using (true)
  with check (true);

-- Storage bucket for the final signed-ready PDFs. Private (not public) --
-- only accessed server-side via the service role key.
insert into storage.buckets (id, name, public)
values ('engagement-documents', 'engagement-documents', false);

-- Public bucket for client logos, shown co-branded alongside the Fonder logo
-- on the portal. Public is fine here (unlike the SOW/MSA bucket above) --
-- a logo isn't sensitive, and public buckets serve directly via a CDN URL
-- without needing extra read policies.
insert into storage.buckets (id, name, public)
values ('engagement-logos', 'engagement-logos', true);
