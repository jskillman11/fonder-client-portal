-- Stage 9: QuickBooks Online integration -- single-tenant OAuth connection
-- (Fonder's own QuickBooks company, not one per client), plus the
-- per-company/per-engagement fields needed to create and track real
-- invoices.

-- Singleton: exactly one QuickBooks connection for the whole app. Doesn't
-- fit lib/company-settings.ts's per-company pattern since this isn't
-- company-scoped -- it's Fonder's own credential, shared across every
-- client. Service-role only, same trust boundary as profiles/
-- portal_access_tokens; no RLS policies at all (never read via anon key).
create table quickbooks_connection (
  id boolean primary key default true check (id), -- singleton trick: only one row can ever exist
  environment text not null default 'sandbox' check (environment in ('sandbox', 'production')),
  realm_id text not null,
  access_token text not null,
  refresh_token text not null,
  access_token_expires_at timestamptz not null,
  refresh_token_expires_at timestamptz not null,
  connected_by_email text, -- audit: which admin completed the OAuth dance
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table quickbooks_connection enable row level security;

-- Reusable across engagements, mirrors company_team_assignments being
-- company- not engagement-scoped -- a company's QuickBooks Customer
-- identity doesn't change between engagements.
alter table companies add column qb_customer_id text;

-- Engagement-scoped, mirrors total_fee already being engagement-scoped.
-- total_fee_amount is a new structured numeric field collected alongside
-- the existing free-text total_fee display string -- total_fee itself is
-- untouched, this just adds the real number a QuickBooks invoice needs.
alter table engagements add column total_fee_amount numeric(12, 2);
alter table engagements add column qb_invoice_id text;
alter table engagements add column qb_invoice_link text;
alter table engagements add column invoice_sent_at timestamptz;
alter table engagements add column invoice_paid_at timestamptz; -- set by the QuickBooks webhook once Invoice.Balance === 0

NOTIFY pgrst, 'reload schema';
