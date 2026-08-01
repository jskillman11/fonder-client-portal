-- Stage 2 auth unification -- run once, in the SQL Editor of the LIVE
-- project (confirmed: ifddezqyozounhilkfgp), against the schema already
-- created by supabase-setup.sql.
--
-- Run the three sections below IN ORDER, verifying staff access still works
-- in the admin dashboard after section 2 before running section 3. Do not
-- run section 3 until every existing admin user has a profiles row (section
-- 2), or every current admin loses table access the instant it runs.

-- ============================================================
-- Section 1: profiles table -- the new role concept
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('staff', 'client')),
  client_id uuid references clients(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Users can read their own profile (needed so both admin and portal server
-- code can look up "who is this and what's their role" via the user's own
-- session). No client-side insert/update policy -- profiles are only ever
-- written by service-role server code.
create policy "users read own profile"
  on profiles for select to authenticated using (id = auth.uid());

-- ============================================================
-- Section 2: backfill staff profiles for existing admins
-- ============================================================
-- Every auth.users row today is implicitly staff (only staff have ever had
-- accounts). Run this, then verify in the admin dashboard that every
-- existing admin can still list/create/edit companies, clients, documents,
-- and engagements BEFORE running section 3.

insert into profiles (id, role)
select id, 'staff' from auth.users
on conflict (id) do nothing;

-- ============================================================
-- Section 3: tighten RLS from "any authenticated user" to "staff only"
-- ============================================================
-- Only run this after section 2 is verified. After this, all 9 tables
-- below require profiles.role = 'staff', not just any Supabase session --
-- this is what stops a client's real Supabase Auth session (once Phase 3
-- ships) from getting blanket CRUD via a stray direct API call.

drop policy "authenticated users manage companies" on companies;
create policy "staff manage companies" on companies for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));

drop policy "authenticated users manage clients" on clients;
create policy "staff manage clients" on clients for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));

drop policy "authenticated users manage documents" on documents;
create policy "staff manage documents" on documents for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));

drop policy "authenticated users manage engagements" on engagements;
create policy "staff manage engagements" on engagements for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));

drop policy "authenticated users manage team members roster" on team_members;
create policy "staff manage team members roster" on team_members for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));

drop policy "authenticated users manage milestones" on engagement_milestones;
create policy "staff manage milestones" on engagement_milestones for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));

drop policy "authenticated users manage team assignments" on engagement_team_assignments;
create policy "staff manage team assignments" on engagement_team_assignments for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));

drop policy "authenticated users manage portal copy" on portal_copy;
create policy "staff manage portal copy" on portal_copy for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));

drop policy "authenticated users manage access tokens" on portal_access_tokens;
create policy "staff manage access tokens" on portal_access_tokens for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));

-- Note: portal_access_tokens itself becomes unused once Phase 3 ships
-- (Supabase's own OTP flow replaces it). Keep the table (and this policy)
-- in place for one deploy cycle as a rollback path, then drop both in a
-- follow-up cleanup migration once Phase 3 + 4 are verified stable.
