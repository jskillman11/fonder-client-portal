-- Stage 4: move engagement internals up to company level -- run once, in the
-- SQL Editor of the LIVE project (confirmed: ifddezqyozounhilkfgp), against
-- the schema already extended by supabase-stage2-profiles.sql and
-- supabase-stage3-user-management.sql.
--
-- A company can only ever have one ACTIVE engagement at a time. Team,
-- Documents-in-force, Shared Drive, Portal content/tab-locks, and the
-- client's portal routing slug all move from `engagements` to `companies`,
-- since they're properties of the ongoing brand relationship, not of a
-- specific contract period. `engagements` becomes a lean historical record:
-- title, fee, dates, scope, milestones, stakeholder client, status.
--
-- Run SECTION 1 now. It is additive and reversible -- existing app code does
-- not read any of these new columns/tables, so nothing breaks.
--
-- Do NOT run SECTION 2 until the corresponding app code deploy (lib/*, API
-- routes, admin UI) is live and verified working end-to-end: a real
-- company's portal renders, the admin company page shows team / documents-
-- in-force / shared drive / portal locks with the backfilled values,
-- "+ New engagement" and "Mark as completed" both work. SECTION 2 drops
-- columns and a table -- there is no undo short of a full database restore.
-- Take a fresh backup/PITR checkpoint before running it.

-- ============================================================
-- SECTION 1: additive schema + backfill (safe, reversible)
-- ============================================================

-- New columns on companies -- portal identity + "currently in force"
-- settings, all nullable/defaulted so existing rows are valid immediately.
alter table companies add column client_slug text unique;
alter table companies add column sow_document_id uuid references documents(id);
alter table companies add column msa_document_id uuid references documents(id);
alter table companies add column lock_portal_tabs boolean not null default true;
alter table companies add column shared_drive_url text;
alter table companies add column tab_lock_overrides jsonb not null default '{}'::jsonb;

-- Engagement lifecycle status. Defaults every existing row to 'active'; the
-- next step demotes all but the most recent engagement per company.
alter table engagements add column status text not null default 'active'
  check (status in ('active', 'completed'));

with latest_engagement as (
  select distinct on (company_id) id
  from engagements
  where company_id is not null
  order by company_id, created_at desc
)
update engagements
set status = 'completed'
where company_id is not null
  and id not in (select id from latest_engagement);

-- Note: an engagement row with a null company_id (allowed by the existing
-- schema, though not expected in practice) is left 'active' by default and
-- can never collide with the partial unique index below, since Postgres
-- treats each null company_id as distinct for uniqueness purposes.

-- Backfill companies' new columns from each company's most-recent (now
-- 'active') engagement.
with latest_engagement as (
  select distinct on (company_id)
    company_id, client_slug, sow_document_id, msa_document_id,
    lock_portal_tabs, shared_drive_url, tab_lock_overrides
  from engagements
  where company_id is not null
  order by company_id, created_at desc
)
update companies c
set
  client_slug = le.client_slug,
  sow_document_id = le.sow_document_id,
  msa_document_id = le.msa_document_id,
  lock_portal_tabs = le.lock_portal_tabs,
  shared_drive_url = le.shared_drive_url,
  tab_lock_overrides = le.tab_lock_overrides
from latest_engagement le
where le.company_id = c.id;

-- Enforce one active engagement per company at the DB level. Safe to add
-- now because the update above already guarantees at most one 'active' row
-- per non-null company_id.
create unique index engagements_one_active_per_company
  on engagements(company_id) where status = 'active';

-- Team moves to the company level -- no per-engagement snapshot. "Account
-- team" becomes a standing thing for the brand, not re-assigned per
-- engagement.
create table company_team_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  team_member_id uuid not null references team_members(id) on delete cascade,
  sort_order int not null default 0,
  unique (company_id, team_member_id)
);

alter table company_team_assignments enable row level security;
create policy "staff manage company team assignments" on company_team_assignments
  for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));

-- Seed company_team_assignments from each company's active engagement's
-- current assignments. This intentionally does NOT preserve which team
-- members were on past/completed engagements -- accepted tradeoff per the
-- new "account team" model.
insert into company_team_assignments (company_id, team_member_id, sort_order)
select e.company_id, eta.team_member_id, eta.sort_order
from engagement_team_assignments eta
join engagements e on e.id = eta.engagement_id
where e.status = 'active' and e.company_id is not null
on conflict (company_id, team_member_id) do nothing;

-- ============================================================
-- SECTION 2: irreversible cleanup -- RUN ONLY AFTER APP CODE DEPLOY
-- ============================================================
-- Point of no return. Take a fresh Supabase backup/PITR checkpoint before
-- running this section.

drop table engagement_team_assignments;

alter table engagements drop column client_slug;
alter table engagements drop column sow_document_id;
alter table engagements drop column msa_document_id;
alter table engagements drop column lock_portal_tabs;
alter table engagements drop column shared_drive_url;
alter table engagements drop column tab_lock_overrides;

NOTIFY pgrst, 'reload schema';
