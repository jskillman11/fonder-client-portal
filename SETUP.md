# Fonder Client Portal — Project Status & Handoff

Last updated: August 7, 2026
Status: **Live for Coros** (first real client). Core signing flow is mid-migration
from Documenso to DocuSeal (see "Signing flow" below — code is done, DocuSeal
account/webhook setup and a real end-to-end test are still pending). The
authenticated client portal app (chat, invoices, deliverables, etc.) is
mostly still scaffolded, but **Tasks is now fully real** (ClickUp-backed —
see "The client portal app" below). This pass also replaced the admin's
per-company Overview tab and the org-level Team/Portal-content tabs with
nested "Brand Settings"/"Workspace Settings" tabs (see "The admin dashboard"
below), and unified the account-team roster with real staff profiles (see
"The Team page" below) — going forward every new roster entry must be linked
to a staff account, whereas before linking was optional.

This document describes the **current state of the system**, not the history
of how it got here. Read this before touching the code, especially in a fresh
Claude Code session with no memory of this conversation.

---

## What this is

A branded client onboarding, e-signature, and (eventually) project-tracking
portal for Fonder Studio, replacing the old generate-a-PDF-and-email-it
workflow.

A client gets a link (`/portal/[slug]`), unlocks it with a magic-link email
(or an admin can preview it directly, no link needed), and sees: an overview
of the engagement (scope, schedule, fee), their account team, and a 4-step
action list: review and sign, pay a deposit, schedule kickoff, access an
ongoing client portal. The SOW and MSA are two fully independent signing
events, signed directly inside the portal via an embedded DocuSeal form —
no email round-trip required for the client.

The `[slug]` is a property of the brand/company itself, generated
automatically when the company is created (see "Data model" below) — a
company's portal link exists before any engagement details are even filled
in, and stays the same for as long as the company exists.

## Architecture

| Service | What it does | Where it's hosted |
|---|---|---|
| This Next.js app | The branded client portal plus the full admin dashboard | Vercel |
| Supabase (project ref `ifddezqyozounhilkfgp`) | All structured data, file storage, and auth (staff + client) | Supabase — **this is the live ref; ignore any older docs/env files pointing at a different ref, they're stale** |
| DocuSeal | The e-signature engine — HTML-in, PDF-out, inline field tags, no coordinate placement | Cloud (`api.docuseal.com`) or self-hosted, your choice — see "Signing flow" |
| Resend | Sends this app's magic-link and staff-invite emails | Existing Fonder Resend account |
| Cal.com | Real scheduling calendar for the kickoff step | Existing Fonder Cal.com account |

The previous architecture (Documenso self-hosted on Railway, a separate
`fonder-pdf-renderer` HTML-to-PDF Railway service, Cloudflare R2 for
Documenso's uploads, `pdf-lib` for signature-field coordinate placement) has
been **fully removed** — DocuSeal accepts HTML directly and places fields via
inline tags, so none of that infrastructure is needed anymore. If Railway
services for these still exist, they're safe to decommission.

## Data model

**"Engagement" is a type (`project`|`partnership`), not a row with its own
lifecycle.** There is no `engagements` table anymore — every piece of
per-contract state lives directly on `companies`, since a company only ever
has one ongoing engagement at a time. If you see references to a separate
`engagements` table, `engagement_id`, an active/completed `status`, or a
"start an engagement" step in old docs/commits, those are gone (removed in
the "phase out engagements" restructure).

- `companies`: a brand/organization, and now also the single source of
  truth for its one ongoing engagement. Holds `name`, `logo_storage_path`,
  the `client_slug` (portal routing key — generated automatically at
  company creation, see "Adding a new client" below, not tied to any
  engagement setup step), which SOW/MSA document is currently in force
  (`sow_document_id`/`msa_document_id`, FKs into `documents`),
  `lock_portal_tabs`, `shared_drive_url`, `tab_lock_overrides`, and every
  engagement-specific field: `client_id` (the stakeholder signatory),
  `engagement_title`, `engagement_type` (`'project'|'partnership'`),
  `partnership_tier`, `payment_terms`, `duration_months`, `total_fee(_amount)`,
  `final_delivery_date`, `scope_summary`, `kickoff_earliest_date`/
  `kickoff_booked_at`/`kickoff_start_time`, real signing completion
  (`sow_signed_at`/`msa_signed_at`/`sow_signed_document_path`/
  `msa_signed_document_path`, set by the DocuSeal webhook),
  `fonder_signatory_name`/`_email`, and QuickBooks invoicing state
  (`qb_customer_id`, `qb_invoice_id`, `qb_invoice_link`, `invoice_sent_at`,
  `invoice_paid_at`). All of it is nullable/empty until staff fill it in on
  the company's Brand Settings > Client & Schedule sub-tab — a brand new
  company has a working portal link immediately, with nothing configured
  yet.
- `clients`: a real person, belonging to one company. A company can have
  multiple clients; one is picked as the signatory (`companies.client_id`).
- `documents`: SOW or MSA content in Markdown, scoped to a company, reusable
  if the document is later swapped for a new version. **Swapping which
  document is in force (`sow_document_id`/`msa_document_id`) automatically
  resets that document's signed state** (`app/api/admin/update-company-settings/route.ts`)
  — that's the only re-sign trigger; there's no separate "reset signature"
  action.
- `team_members`: Fonder's own staff roster, global — `name`, `role`,
  `icon_bg_color`/`icon_text_color`, and an optional `staff_id` FK into
  `profiles`. When set, the roster entry's displayed name/role/icon
  colors/photo are sourced live from that staff account's profile instead
  of this row's own columns (see "The Team page" below). **Linking is now
  required for every new roster entry** — creating one means picking an
  existing staff account, not typing a name/role fresh. Pre-existing
  unlinked rows (added before this rule) still work exactly as before;
  their detail page just offers linking (or removing from the roster), not
  free-text editing.
- `company_team_assignments`: join table, which team members are the
  standing "account team" for a company. Not per-engagement — there's only
  ever one engagement per company to be scoped to anyway.
- `company_milestones`: label/date pairs shown in the portal Overview's
  schedule, keyed by `company_id`.
- `company_invoice_installments` / `company_billing_cycles`: the payment
  schedule for `project`-type (installments, from `payment_terms`) vs.
  `partnership`-type (monthly billing cycles, created by the cron job)
  engagements, both keyed by `company_id`. See "QuickBooks invoicing" below.
- `profiles`: `id` references `auth.users.id`, `role: 'staff'|'client'`,
  nullable `client_id`, `is_super_admin`, plus `full_name`, `job_title`,
  `avatar_storage_path`, `icon_bg_color`, `icon_text_color`. This is the
  single source of truth for both staff and client auth (see "Auth" below)
  — both roles are real Supabase Auth users, not two parallel systems. A
  staff member's own `job_title` doubles as their client-facing "role" if
  their `team_members` roster entry is linked to them (one field, not two)
  — see "The Team page" below.
- `portal_copy`: every piece of client-facing text as editable key/value
  rows, with hardcoded fallbacks in `lib/portal-copy-constants.ts`.
- `brand_settings`: singleton row (same `id boolean primary key default
  true` trick as `quickbooks_connection` below) holding Fonder's own admin
  UI branding — `login_logo_storage_path` (shown standalone above the
  staff login card) and `sidebar_logo_storage_path` (shown in the sidebar's
  small square tile) are two independent slots, not one shared logo — a
  wordmark that looks right on the login page reads as a plain block of
  color once cropped into the tiny sidebar tile. Managed at
  `/admin/settings/brand`, super-admin only.

## The client-facing portal (`/portal/[slug]`)

Four sections, top to bottom:

1. Welcome: co-branded logo, templated greeting using the client's first name.
2. Overview: scope summary, schedule list, total fee, final delivery date.
3. Team: the company's standing account team.
4. What's Next, four steps, each its own bordered block:
   - Review and sign: real buttons, one per document, linking into the
     embedded DocuSeal signing page. See "Signing flow" below.
   - Invoice and deposit: a visibly disabled placeholder, no QuickBooks yet.
   - Schedule kickoff: a real embedded Cal.com calendar.
   - Access your client portal: links into `/portal/[slug]/app` (see below).

Steps 2 and 3 (Invoice/deposit, Schedule kickoff) unlock together once both
applicable documents are **actually signed** (real, DB-persisted state —
`companies.sow_signed_at`/`msa_signed_at`, computed fresh from the database
on every page load, not just "session started" — this used to be ephemeral
client-side-only state that reset on refresh; that's fixed). Step 2 has
nothing of its own to complete yet (no QuickBooks), so it's a pass-through.

The **other portal tabs** (`/app/*` — Tasks, Chat, Invoices, Deliverables,
etc.) unlock on a *separate*, later signal: a real Cal.com booking, not just
signing. `components/KickoffScheduler.tsx` listens for Cal.com's
`bookingSuccessfulV2` embed event and persists `companies.kickoff_booked_at`/
`kickoff_start_time`; the global unlock requires both documents signed
**and** a kickoff actually booked (`app/portal/[client]/app/layout.tsx`'s
`onboardingComplete`). Once booked, the calendar embed is replaced with a
"Meeting booked for [date/time]" summary (no reschedule/cancel UI yet — out
of scope for now); once every step is done, `WhatsNext` shows an "Onboarding
completed" message.

## Signing flow: the actual current behavior

Clicking "Review and sign" navigates to `/portal/[slug]/sign/[docType]`
(component `SigningSession.tsx`), which calls `/api/sign/create-session` and
renders DocuSeal's real signing form directly in the page via
`@docuseal/react`'s `<DocusealForm>` — no email required for the client to
sign, no PDF pre-rendering, no coordinate placement.

Under the hood: `create-session` builds the document HTML fresh from the
company's SOW/MSA Markdown (`lib/pdf-template.ts`, still using `marked` for
Markdown → HTML), with signature/date fields as inline `<signature-field>`/
`<date-field>` tags (auto-detected by DocuSeal — no page-count/coordinate
math needed, unlike the old Documenso integration). It POSTs that HTML
straight to DocuSeal's `/submissions/html` with two submitters (`role:
"Client"` and `role: "Fonder"`), each carrying `external_id:
"{companyId}:{docType}"` so the completion webhook can identify which
company/doc type finished signing without any stored id-mapping column.

`rememberSignature`/`reuseSignature` are enabled on the embed, so a returning
signer gets a real one-click signature experience (DocuSeal stores it in
their browser).

The completion webhook (`app/api/webhooks/docuseal/route.ts`) verifies
DocuSeal's HMAC signature (`X-Docuseal-Signature` header, over the *raw*
request body) and, on a `submission.completed` event (fires once, after
*all* signers finish), sets `companies.sow_signed_at`/`msa_signed_at`.

SOW and MSA are two fully independent DocuSeal submissions, not one combined
signature.

**Still pending, not yet done**: a DocuSeal account needs to be set up
(cloud or self-hosted), `DOCUSEAL_API_KEY`/`DOCUSEAL_API_URL` set, a webhook
registered with `DOCUSEAL_WEBHOOK_SECRET`, and a real end-to-end signing
test run — the payload shape used in the webhook handler is implemented per
DocuSeal's documented format but hasn't been verified against a live account
yet.

## Client-facing auth (magic links + real Supabase Auth)

Both staff and clients are real Supabase Auth users, distinguished by
`profiles.role`. The portal and the `/app` area require either:

- A valid client session: the client enters their email on a gate screen, or
  an admin triggers it via "Send link" in the header's Open Portal submenu
  (see "The admin dashboard" below). This sends a real Supabase magic link
  (`auth.admin.generateLink`); clicking it sets a session cookie. The email
  only ever goes to the client's registered address, checked against
  `clients.email`.
- An active staff session: logged into `/admin` lets you preview any
  client's portal directly, via `hasPortalAccess()` in
  `lib/supabase/server.ts` (staff are always authorized).

Client access is checked directly against the company's designated
stakeholder (`profiles.client_id` must match `companies.client_id`) — if
staff change who the stakeholder is, portal access transfers to the new
person immediately. There's a revoke-access action on the admin Clients
section (`lib/client-access.ts`), available to any staff member.

## Staff auth (Google Workspace SSO)

Staff sign in with **Google only** — email/password and the old
invite-link/set-password flow are gone entirely (`app/admin/login/page.tsx`
+ `components/login-form.tsx` are just a "Continue with Google" button;
`app/admin/auth/callback/route.ts` completes the OAuth code exchange).
`proxy.ts` still gates `/admin`/`/api/admin` on `profiles.role === 'staff'`
— **a Google sign-in alone is not sufficient**, the person must already
have been invited (`lib/staff.ts`'s `inviteStaff()` creates the
`auth.users` + `profiles(role='staff')` row directly, no link to click;
Supabase's automatic account-linking-by-email connects their first Google
sign-in to that pre-existing row). The `hd: "fonder.studio"` param on the
OAuth request is a UX hint for Google's account picker only, not a real
security boundary — the invite-first check is what actually gates access.

Requires, one-time, outside this repo:
- A Google Cloud OAuth client (Web application type), redirect URI set to
  Supabase's own callback (`https://ifddezqyozounhilkfgp.supabase.co/auth/v1/callback`).
- The Google provider enabled in Supabase (Authentication → Providers) with
  that client's ID/secret, and automatic account linking on.
- **Supabase's Site URL** (Authentication → URL Configuration) set to the
  real production domain (`https://fonder-client-portal.vercel.app`), not
  left at its `localhost:3000` default — if `redirectTo` doesn't match an
  entry in the Redirect URLs allow-list, Supabase silently falls back to
  Site URL instead of erroring, which is exactly what caused login to
  bounce to localhost on production before this was caught and fixed.
  Redirect URLs needs both the production and local
  `.../admin/auth/callback` entries.

## The Team page: roster ↔ staff accounts

The **account-team roster** (`team_members` — who clients see listed as
their team, selected onto a company via `company_team_assignments`) and
**staff accounts** (`profiles(role='staff')` — who can log into `/admin`,
super-admin only) are two previously-separate concepts, still two separate
tables, now presented as one merged experience: the "Team" sub-tab under
Workspace Settings (`/admin/settings/team`).

**Adding a roster member now requires picking an existing staff account** —
`NewTeamMemberForm` no longer has a free-text "add manually" option; if
there's no unlinked staff account to pick, you invite one first (same page,
"Staff accounts" section below, super-admin only). Clicking into a roster
entry (`/admin/settings/team/[id]`) reuses `EditProfileForm` — literally the
same component/page as `/admin/settings/profile` — so name, role, photo,
and icon colors are edited in exactly one place. A super-admin (or the
person themselves) can edit; anyone else viewing sees it read-only. Icon
colors use the same 4-preset swatch picker everywhere now (Profile used to
have its own raw color-input pickers; unified for consistency). An uploaded
photo takes precedence over the colored-initials fallback wherever a team
member shows up — roster list, a company's team picker, and the
client-portal Team section (the last of these had a real gap: its query
never joined the linked staff profile at all, so a linked person's live
name/role/photo never actually reached the client side; fixed alongside
this).

Pre-existing unlinked rows (added before this rule existed) still display
using their own `name`/`role`/`icon_bg_color`/`icon_text_color` columns
exactly as before — their detail page just offers linking to a staff
account (or removing the row from the roster), not free-text editing.
Unlinking an already-linked entry back to this state is super-admin only,
enforced both in the UI and in `/api/admin/unlink-team-member`.

## The client portal app (`/portal/[slug]/app/*`)

A separate authenticated area, linked from What's Next step 4. Real routes,
real tab navigation (`lib/portal-app-tabs.ts`: Home, Tasks, Shared Drive,
Chat, Invoices, Deliverables, Change Request), real auth protection and
per-tab lock overrides — but only two tabs have real content:

- **Onboarding** (the portal's root/landing content, described above): fully
  real.
- **Shared Drive**: real — redirects to `companies.shared_drive_url` if set,
  otherwise a placeholder.
- **Tasks**: real, ClickUp-backed (`lib/clickup.ts`). One shared Personal API
  Token for Fonder's whole ClickUp workspace (singleton `clickup_connection`
  row, admin-managed at Data Connectors); a company's `clickup_list_ids`
  says which ClickUp Lists belong to it. A task is only ever shown to the
  client if a custom field named "Position" has "Client" selected — not a
  tag, not the ClickUp assignee (clients have no ClickUp account). The tab
  shows open tasks sorted by due date (nearest/overdue first, no-due-date
  tasks last), then a separate "Closed" section sorted by most recently
  completed (`status.type === "closed"`, ClickUp's own categorization, not a
  string match against a status label — those vary per list's configured
  status scheme). Clicking a task opens `/portal/[slug]/app/tasks/[taskId]`
  (description, start/due date, status), which re-fetches directly from
  ClickUp's single-task endpoint and re-verifies both checks itself (client-
  visible **and** belongs to one of this company's own lists) rather than
  trusting that arriving via the list means it's safe — otherwise a client
  could view any task in the shared workspace by pasting a different task
  ID into the URL. Every "can't show this" case (not found, wrong company,
  not client-visible) collapses to the same not-found result.
- Everything else (Home, Chat, Invoices, Deliverables, Change Request):
  still a generic "coming soon" card each. Change Request has the most
  fleshed-out placeholder (disabled date-picker/priority-selector,
  description of the intended full workflow) but no real logic.

## The admin dashboard (`/admin/*`)

Protected by real Supabase staff-session auth via `proxy.ts` (Next.js 16
renamed `middleware.ts` → `proxy.ts`; see "Staff auth" above). Sidebar
shell: `components/admin/AdminNav.tsx` + `components/shell/DashboardShell.tsx`.

Sidebar, top to bottom:

- **Company switcher** (`CompanySwitcher`) — "Fonder" (the org-level view,
  `/admin`) is the default entry above a separator, then the list of
  brands (linking straight to `/admin/companies/[id]/settings/company`,
  see Brand Settings below), then "Add a brand."
- **Primary nav, org-level** (no brand selected): Overview, then a
  collapsible **Workspace Settings** parent with its own sub-tabs — Team
  (roster + staff accounts, see "The Team page" above), Portal Content
  (global copy), and (super-admin only) Brand, Connectors.
- **Primary nav, company-scoped** (a brand selected): Clients, Documents
  (which SOW/MSA is currently in force), Billing (payment schedule +
  invoice), a collapsible **Brand Settings** parent with sub-tabs — Company
  (name/logo), Client & Schedule (client/type/fee/dates/scope/milestones —
  always editable, no separate "start an engagement" step or lifecycle
  status), Team (the standing account-team assignment for this brand),
  Portal (shared-drive/lock settings) — and Data Connectors. **There is no
  separate Overview tab anymore** — it was retired and its two forms
  (company info, client & schedule) became the first two Brand Settings
  sub-tabs; the bare `/admin/companies/[id]` route just redirects to
  `.../settings/company` for old links/bookmarks.
- **Secondary nav**, pinned above the account menu: Get Help, Search (a
  placeholder — no search feature exists to wire it up to yet). Settings
  used to be pinned here too; it moved into the account menu (below) once
  it became redundant with the Workspace Settings tab.
- **Header bar**: breadcrumbs, plus a split "Open Portal" button whenever a
  brand with a portal link is selected — the main click opens the real
  `/portal/[slug]` in a new tab; a chevron opens a submenu with **Copy**
  (an absolute URL, not the app's internal relative path) and **Send
  link** (emails the client a real magic link via the existing
  `send-portal-link`/`createAndSendMagicLink` flow, same as the client's
  own self-serve "Request access").
- **Account menu** (bottom-left corner): Profile, **Workspace Settings**
  (`/admin/settings`, same page as the sidebar tab — a shortcut reachable
  from anywhere, including while browsing a specific brand), Help, Sign
  out.

Both "Settings" nav parents (Brand Settings per company, Workspace
Settings org-level) are collapsible parents with no page of their own —
`/admin/companies/[id]/settings` and `/admin/settings` both just redirect
to their first sub-tab, for anyone hitting the bare route directly.

Known gap: delete works for companies, clients, documents, and team members,
but if something is still referenced, the delete fails with a translated
error rather than corrupting data — it doesn't yet say exactly what's
blocking it.

## Adding a new client (the real, current flow)

1. `/admin/companies`: add the company. Its portal link
   (`/portal/[client_slug]`) exists immediately — the slug is generated
   automatically from the company name at creation time, no separate setup
   step required.
2. That company's Clients and Documents tabs: add the client (signatory)
   and the SOW/MSA document content.
3. That company's Brand Settings > Client & Schedule sub-tab: fill in the
   engagement fields — client (signatory), type (project/partnership), fee,
   dates, scope, schedule. This is always editable, not a one-time creation
   form.
4. That company's Brand Settings > Team/Portal sub-tabs, and the Documents
   tab: assign the account team, pick which SOW/MSA is currently in force,
   set the Shared Drive URL and portal tab-lock behavior.

If a company's engagement details change later (new contract, renewed
scope, different fee), just edit the same Client & Schedule fields — there's
nothing to "complete" or "start over." Swapping the SOW/MSA document
selection is what triggers a fresh signature requirement (see "Data model"
above).

## Cal.com scheduling

One shared event type for everyone, via the `CAL_COM_EVENT_LINK` env var,
not per-engagement data. Each engagement's "kickoff earliest date" opens the
embedded calendar to that month by default via Cal.com's `month=YYYY-MM`
parameter. Soft default only — doesn't hard-block earlier dates; real
calendar availability handles that naturally.

## QuickBooks invoicing: the actual current behavior

Single-tenant integration — there is exactly one QuickBooks connection for
the whole app (Fonder's own company, `quickbooks_connection` singleton
table), not one per client. An admin creates a real lump-sum invoice per
company from the company's Billing tab (`CreateInvoiceForm.tsx` →
`/api/admin/quickbooks/create-invoice`), which looks up/creates a
QuickBooks Customer for the company (`companies.qb_customer_id`), creates a
real Invoice for `companies.total_fee_amount` (a structured numeric field,
separate from the free-text `total_fee` display string), and requests a
hosted `InvoiceLink` (`?include=invoiceLink&minorversion=65`) — the client
pays on QuickBooks' own page, no card data ever touches this app.

Project-type companies with `payment_terms` set instead get an auto-generated
installment plan (`company_invoice_installments`, via
`lib/company-billing.ts`'s `createInstallmentsForCompany`) — staff invoice
each installment individually from the Billing tab
(`/api/admin/create-installment-invoice`). Partnership-type companies get a
monthly billing cycle (`company_billing_cycles`), created automatically by
the `partnership-invoices` cron job (`ensureCurrentBillingCycle`), not
staff-triggered. Note: the QuickBooks payment webhook (next paragraph) only
ever marks `companies.invoice_paid_at` — it does **not** mark individual
`company_invoice_installments`/`company_billing_cycles` rows as paid. That's
a known, accepted gap, not a bug to fix reflexively.

Two things confirmed only by live testing against the sandbox, not from
docs (docs actively suggested otherwise or said nothing):
- **`InvoiceLink` stays null unless the invoice itself has `BillEmail` set**
  (not just the customer's `PrimaryEmailAddr`, which alone was NOT
  sufficient). `findOrCreateCustomer`/`createInvoice` in `lib/quickbooks.ts`
  both set an email now. Setting `BillEmail` does **not** trigger an actual
  email send — QuickBooks only emails on an explicit call to its `/send`
  endpoint, which this app deliberately never calls (portal-only delivery).
- **The `InvoiceLink` QuickBooks returns 404s as given.** It points at
  `https://developer.intuit.com/comingSoonview/{hash}`; the real working
  page is the same hash at `https://connect.intuit.com/t/{hash}`.
  `createInvoice()`'s `toWorkingInvoiceLink()` rewrites it automatically —
  confirmed both by a raw sandbox API call and by community reports that
  the same swap is needed in production too.

The OAuth connect flow (`/admin/settings/connectors`, super-admin only) runs
through `/api/admin/quickbooks/{connect,callback,disconnect}`. Access tokens
refresh transparently via `lib/quickbooks.ts`'s `getValidAccessToken()` —
critical gotcha: QuickBooks **rotates the refresh_token value itself** on
every refresh call, so the newest one must always be persisted or the next
refresh breaks.

The completion webhook (`app/api/webhooks/quickbooks/route.ts`) verifies the
`intuit-signature` header (HMAC-SHA256 over the raw body, keyed with
`QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN` — a distinct credential from the OAuth
Client Secret) and parses QuickBooks' CloudEvents payload format (a JSON
array of envelopes — the legacy `eventNotifications` shape is retired as of
a mandatory migration deadline that has already passed). On a Payment
event, it fetches the Payment, walks `Line[].LinkedTxn[]` back to the
invoice(s) it applied to, and sets `companies.invoice_paid_at` once that
Invoice's `Balance === 0`.

Paid status only updates on the client's next portal page load (no live
polling) — payment happens off-site on QuickBooks' hosted page, so unlike
Cal.com's embedded booking event, there's no trustworthy client-side signal
to hook.

**Verified end-to-end against the live sandbox** (connect → create invoice
→ get a working hosted link → record a payment → confirm the webhook
handler correctly sets `invoice_paid_at`). One piece is NOT verifiable this
way, by QuickBooks' own design: **the sandbox does not actually process
card payments through the hosted invoice page** — the documented mock test
card numbers (4111... etc.) are for the direct Payments API, not the
customer-facing checkout UI, which just declines every card regardless.
Confirmed by clicking through it directly ("Your payment method was
declined") and corroborated by multiple Intuit community threads asking the
same thing. To get past this for a real completion test, a Payment was
recorded directly via `POST /v3/company/{realmId}/payment` (a legitimate
accounting entry, not a card charge) to zero out the Invoice's `Balance`,
then the webhook handler was driven directly with a correctly-signed
CloudEvents payload referencing that real Payment/Invoice pair — this
proved every piece of *our* code (signature verification, CloudEvents
parsing, Payment→Invoice lookup, DB update) works correctly; only the
actual "swipe a card and have QuickBooks' processor approve it" step is
untestable before going live with production keys and real QuickBooks
Payments. Note also: the exact webhook `type` string for Payment events
(`qbo.payment.*.v1`) is still pattern-inferred rather than verbatim-confirmed
from Intuit's docs — the handler matches loosely (`type.includes("payment")`)
and logs every event type seen, so tighten it once a real webhook delivery
(not simulated) shows the actual string.

## Where the secrets live, not in this repo, on purpose

| Secret | Lives in |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY | Vercel |
| SUPABASE_SERVICE_ROLE_KEY | Vercel, bypasses all RLS, never commit it |
| DOCUSEAL_API_KEY, DOCUSEAL_API_URL | Vercel — API_URL optional, defaults to `https://api.docuseal.com` if unset |
| DOCUSEAL_WEBHOOK_SECRET | Vercel, the HMAC secret from DocuSeal's console Security tab — verifies `/api/webhooks/docuseal` is really DocuSeal calling |
| RESEND_API_KEY | Vercel, this app's own key |
| PORTAL_EMAIL_FROM | Vercel, optional, must match a domain verified for RESEND_API_KEY |
| CAL_COM_EVENT_LINK | Vercel |
| QUICKBOOKS_CLIENT_ID, QUICKBOOKS_CLIENT_SECRET | Vercel — Intuit developer dashboard, currently sandbox/Development keys only |
| QUICKBOOKS_REDIRECT_URI | Vercel, must exactly match the OAuth redirect URI registered in the Intuit dashboard |
| QUICKBOOKS_ENVIRONMENT | Vercel, `sandbox` or `production` — controls which QuickBooks API base URL is used |
| QUICKBOOKS_ITEM_ID | Vercel, the id of a one-time generic service Item created in the QuickBooks company, used as every invoice's line item |
| QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN | Vercel, from the Intuit dashboard's Webhooks tab — a distinct credential from the OAuth Client Secret, verifies `/api/webhooks/quickbooks` is really QuickBooks calling |
| QUICKBOOKS_SANDBOX_REALM_ID | Local only, informational — the actual connected realm id lives in the `quickbooks_connection` DB row, set via the OAuth flow, not this env var |

For anyone else to actually work on this, code access alone isn't enough.
They need adding as a collaborator on GitHub, Vercel, Supabase, and DocuSeal.
If you can't add someone directly, put real secret values in a shared
password manager, never in GitHub.

## Known gotchas, real, already happened

1. **`@supabase/storage-js`'s `.upload()` method silently corrupts binary
   buffers when it runs inside Vercel's serverless Node.js runtime** —
   confirmed by uploading the identical buffer two ways in one request (the
   SDK's `.upload()` vs. a raw `fetch()` to the Storage REST API) and
   comparing the stored bytes; the SDK's came back corrupted, the raw fetch
   didn't. Never reproduces locally (`next dev`), which is what made this
   take a while to isolate — every step tested in isolation locally (multipart
   parsing, `proxy.ts`, sharp resizing, the upload/download round-trip) came
   back byte-perfect with the exact same code. Every file-upload path in
   this app (brand logos, company logos, staff/client avatars, and the
   DocuSeal webhook's signed-PDF storage) now goes through
   `lib/storage-upload.ts`'s `uploadToStorage()` instead, which bypasses the
   SDK for the actual upload call. **Never call
   `supabase.storage.from(...).upload()` directly in new code — use
   `uploadToStorage()`.** `.download()`, `.remove()`, and `.getPublicUrl()`
   are unaffected, only `.upload()`.
2. Supabase's MCP tooling **can** reach the live project
   (`ifddezqyozounhilkfgp`) — an earlier version of this doc said it
   couldn't; that's no longer true. Schema changes still ship as numbered
   SQL files at the repo root (`supabase-setup.sql`, `-stage2-` through the
   current stage) for human-readable history, but in a session with MCP
   access they're applied directly via the `apply_migration` tool, not
   pasted into the SQL editor by hand.
3. Changing environment variables doesn't restart anything on Vercel — you
   must explicitly trigger a redeploy afterward.
4. Supabase's API layer can report "column not found" even when the column
   genuinely exists. A stale schema cache, not a real problem. Fix: run
   `NOTIFY pgrst, 'reload schema';` in the SQL Editor.
5. Supabase Auth's **Site URL** setting (Authentication → URL Configuration)
   silently overrides where an OAuth `redirectTo` sends the browser if it
   doesn't exactly match an entry in the Redirect URLs allow-list — commonly
   left at its `localhost:3000` default from project creation, since nobody
   revisits it after initial setup. This exact thing caused Google staff
   login to bounce to localhost in production; see "Staff auth" above.
6. DocuSeal's webhook signature must be verified against the **raw request
   body bytes**, not a re-parsed/re-serialized JSON object — the webhook
   handler reads `req.text()` before `JSON.parse`, deliberately in that
   order.
7. QuickBooks' refresh_token value rotates on every refresh call (not just
   the access token) — always persist the newest refresh_token returned, or
   the next refresh call fails even though the ~100-day validity window
   hasn't actually expired.
8. QuickBooks webhooks moved to a CloudEvents payload format (a JSON array
   of envelopes) as of a mandatory migration deadline that has already
   passed — the legacy `eventNotifications`/`dataChangeEvent` shape is not
   what ships today; `app/api/webhooks/quickbooks/route.ts` is written
   against the new format.
9. QuickBooks' `InvoiceLink` field is null unless the invoice has `BillEmail`
   set (customer-level email alone isn't enough), and the URL it returns
   404s as-is — swap `developer.intuit.com/comingSoonview/` for
   `connect.intuit.com/t/` (same hash) to get the real page. Both handled in
   `lib/quickbooks.ts`'s `createInvoice()`.
10. QuickBooks' sandbox does not actually process card payments through the
    hosted invoice page — the documented mock test cards are for the direct
    Payments API only; clicking through the checkout UI always declines. Not
    fixable from this app's side; only testable for real once live with
    production keys.
11. A company logo's padding has to match the logo's **own** background
    color, not a fixed default — `lib/logo-processing.ts`'s
    `normalizeLogoImage()` auto-detects it by sampling the source image's own
    corner pixels (after trimming any transparent canvas padding first,
    common in design-tool exports) instead of relying on a manually-set
    value. A hardcoded default (previously always white) left a visible seam
    around any logo whose own background wasn't white — confirmed by
    inspecting a real company's stored logo byte-for-byte, not assumed.
    Falls back to white only when the corners are transparent (an irregular
    mark with no background of its own) or disagree with each other. There
    is no manual override anymore — `companies.logo_background_color` still
    exists as a column but nothing reads or writes it.
12. ClickUp's list-tasks endpoint (`GET /list/{id}/task`) does **not**
    include `description`/`start_date` — only the single-task endpoint
    (`GET /task/{id}`) does. Both endpoints do include `status.type`
    (`"open"`/`"closed"`/etc., ClickUp's own categorization) and
    `date_closed`, confirmed against real task responses before relying on
    either for the Tasks tab's open/closed grouping.

The Documenso/Railway/R2-specific gotchas from before this migration (S3
transport requirements, Playwright/Chromium version pinning, Docker-only
deploys) no longer apply — that infrastructure is gone.

## What's built vs. what's intentionally stubbed

Fully real and working:
- Companies, clients, documents, team members: full add/edit/delete,
  reusable entities, organized as company-scoped routes rather than flat
  top-level admin pages.
- A company's engagement details (client, type, fee, dates, scope,
  schedule) live directly on the company row and are always editable — no
  separate creation step, no active/completed lifecycle to manage.
- Native Markdown rendering with automatic section numbering via CSS
  counters.
- Embedded DocuSeal signing per document, independently, with inline
  auto-detected field placement and one-click remembered signatures
  (pending the account/webhook setup noted above).
- Real, DB-persisted signing-completion tracking, driving real tab-unlock
  state (no longer resets on refresh).
- Unified staff/client Supabase Auth: staff via Google Workspace SSO
  (invite-first, no self-serve signup), clients via magic link. The
  account-team roster and real staff accounts are unified into one edit
  experience (see "The Team page" above) — linking is now required for new
  roster entries.
- Real Cal.com scheduling embed.
- Centralized, globally-editable portal copy.
- Company-scoped admin dashboard with a brand picker (Fonder itself is a
  selectable default entry), collapsible nested "Settings" tabs at both the
  org level (Workspace Settings) and per company (Brand Settings), a Data
  Connectors status hub (QuickBooks/Google/ClickUp/Supabase), and
  manageable admin-UI branding (two independent logo slots: login page,
  sidebar icon).
- QuickBooks invoicing: real single-tenant OAuth connection, real invoice
  creation with a hosted QuickBooks pay link, real webhook-driven payment
  tracking (pending the account/webhook setup noted above).
- Client-visible Tasks, backed by ClickUp — list with due-date sort and a
  separate closed-tasks section, plus a per-task detail view (description,
  dates, status).

Deliberately stubbed, not forgotten:
- The client portal app's actual functionality beyond Onboarding/Shared
  Drive/Tasks (Chat, Invoices, Deliverables, Change Request). Real routes,
  nav, and lock behavior exist; no real data or logic yet.
- The "Search" item pinned in the admin sidebar's secondary nav is a
  placeholder — no search feature is built yet.

## Open items, unresolved on purpose, not bugs

- Coros's SOW still states an open scope question: 3 features are confirmed,
  the engagement allows for 3 to 5, and the identity of any 4th or 5th
  feature was never pinned down with the client. Worth resolving directly
  with Coros, not something to guess at in code.
- Fonder's own signatory (Tom Abrams) still signs via whatever DocuSeal
  invite flow their "Fonder" submitter role triggers (default email invite,
  not the embedded client flow). This wasn't a deliberate design decision so
  much as where the natural split landed; worth a second look if it ever
  matters.
