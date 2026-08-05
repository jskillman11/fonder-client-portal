-- Stage 17: engagement types (Project vs. Partnership) and real billing
-- schedules. Projects are staff-triggered per-installment invoices computed
-- from a fixed payment-terms scheme; Partnerships are calendar-driven
-- monthly cycles created by a cron job. Also adds ClickUp/Google Sheets id
-- capture on companies (no sync logic yet -- ids only, for now).

alter table engagements
  add column engagement_type text not null default 'project'
    check (engagement_type in ('project', 'partnership')),
  add column partnership_tier text
    check (partnership_tier in ('growth', 'venture')),
  add column payment_terms text
    check (payment_terms in ('50_25_25', '50_40_10', 'monthly_in_advance')),
  add column duration_months integer;

-- Project billing: a precomputed set of percentage-of-budget installments
-- from the engagement's payment_terms. Staff clicks "Create invoice" per
-- row when they know a real-world trigger (e.g. a milestone) was reached --
-- there's no milestone-completion tracking today, so this is never
-- auto-detected.
create table engagement_invoice_installments (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references engagements(id) on delete cascade,
  sequence int not null,
  trigger_label text not null,
  percentage numeric(5,2) not null,
  amount numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending', 'invoiced', 'paid')),
  qb_invoice_id text,
  qb_invoice_link text,
  invoice_sent_at timestamptz,
  invoice_paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- Partnership billing: one row per calendar month, created automatically by
-- the cron job in app/api/cron/partnership-invoices. The unique constraint
-- on (engagement_id, period_start) is the idempotency guard -- the cron can
-- run any number of times for the same month and only ever create one cycle.
create table engagement_billing_cycles (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references engagements(id) on delete cascade,
  period_label text not null,
  period_start date not null,
  amount numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending', 'invoiced', 'paid')),
  qb_invoice_id text,
  qb_invoice_link text,
  invoice_sent_at timestamptz,
  invoice_paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (engagement_id, period_start)
);

alter table companies
  add column clickup_list_ids text[] not null default '{}',
  add column google_sheet_ids text[] not null default '{}';

NOTIFY pgrst, 'reload schema';
