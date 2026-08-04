# Fonder Client Portal — Project Status & Handoff

Last updated: August 3, 2026
Status: **Live for Coros** (first real client). Core signing flow is mid-migration
from Documenso to DocuSeal (see "Signing flow" below — code is done, DocuSeal
account/webhook setup and a real end-to-end test are still pending). The
authenticated client portal app (tasks, chat, invoices, etc.) is scaffolded
but intentionally not functional yet. See "What's built vs. stubbed" below.

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

The `[slug]` is stable **per brand/company**, not per engagement — a company
keeps the same portal link across multiple engagements over time (see "Data
model" below).

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

- `companies`: a brand/organization. Holds `name`, `logo_storage_path`, the
  stable portal `client_slug`, and everything that's a property of the
  ongoing brand relationship rather than a specific contract: which
  SOW/MSA document is currently in force (`sow_document_id`/`msa_document_id`,
  FKs into `documents`), `lock_portal_tabs`, `shared_drive_url`,
  `tab_lock_overrides`, and real signing completion (`sow_signed_at`/
  `msa_signed_at`, set by the DocuSeal webhook).
- `clients`: a real person, belonging to one company. A company can have
  multiple clients; one is picked as the signatory per engagement.
- `documents`: SOW or MSA content in Markdown, scoped to a company, reusable
  across engagements.
- `team_members`: Fonder's own staff roster, global.
- `company_team_assignments`: join table, which team members are the
  standing "account team" for a company. **Not scoped per engagement** —
  no history of who was staffed on a past engagement is kept, by design.
- `engagements`: a lean historical record of one contract period — `company_id`,
  `client_id` (stakeholder), title, fee, dates, scope summary, `status`
  (`'active'|'completed'`), enforced **one active engagement per company** via
  a DB-level partial unique index. Does NOT hold the slug, documents,
  team, shared drive, or portal-lock settings anymore — those all live on
  `companies` (see above).
- `engagement_milestones`: label/date pairs shown in the portal Overview's
  schedule, scoped per engagement (this one thing does stay per-contract).
- `profiles`: `id` references `auth.users.id`, `role: 'staff'|'client'`,
  nullable `client_id`, `is_super_admin`. This is the single source of truth
  for both staff and client auth (see "Auth" below) — both roles are real
  Supabase Auth users, not two parallel systems.
- `portal_copy`: every piece of client-facing text as editable key/value
  rows, with hardcoded fallbacks in `lib/portal-copy-constants.ts`.
- `portal_access_tokens`: **dead table, unused** — an early hand-rolled
  magic-link mechanism, superseded by real Supabase Auth
  (`auth.admin.generateLink`/`verifyOtp`). Kept as a rollback path; safe to
  drop in a future cleanup pass.

A few now-orphaned columns on `engagements` from earlier schema iterations
were already cleaned up as part of the company-level restructure — if you
see references to `sow_content_markdown`/`msa_content_markdown` or
`client_name` directly on `engagements` in old docs/commits, those are gone.

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
  an admin triggers it via "Send access link" on the admin dashboard. This
  sends a real Supabase magic link (`auth.admin.generateLink`); clicking it
  sets a session cookie. The email only ever goes to the client's registered
  address, checked against `clients.email`.
- An active staff session: logged into `/admin` lets you preview any
  client's portal directly, via `hasPortalAccess()` in
  `lib/supabase/server.ts` (staff are always authorized).

Client access is checked against the **company's currently active
engagement's** stakeholder (`profiles.client_id` must match that
engagement's `client_id`) — if the stakeholder changes when a new engagement
goes active for a company, portal access transfers to the new stakeholder.
There's a revoke-access action on the admin Clients section
(`lib/client-access.ts`), available to any staff member.

## The client portal app (`/portal/[slug]/app/*`)

A separate authenticated area, linked from What's Next step 4. Real routes,
real tab navigation (`lib/portal-app-tabs.ts`: Home, Tasks, Shared Drive,
Chat, Invoices, Deliverables, Change Request), real auth protection and
per-tab lock overrides — but only two tabs have real content:

- **Onboarding** (the portal's root/landing content, described above): fully
  real.
- **Shared Drive**: real — redirects to `companies.shared_drive_url` if set,
  otherwise a placeholder.
- Everything else (Home, Tasks, Chat, Invoices, Deliverables, Change
  Request): still a generic "coming soon" card each. Change Request has the
  most fleshed-out placeholder (disabled date-picker/priority-selector,
  description of the intended full workflow) but no real logic.

## The admin dashboard (`/admin/*`)

Protected by real Supabase staff-session auth via `proxy.ts` (Next.js 16
renamed `middleware.ts` → `proxy.ts`). All pages share a persistent left
sidebar via `components/admin/AdminNav.tsx` + `DashboardShell`.

Nav is **company-scoped**, not a flat list:

- A company picker (`CompanySwitcher`) sits above the nav — "All Clients"
  (`/admin/companies`, the oversight list) or a specific company
  (`/admin/companies/[id]`).
- Picking a company shows that company's Engagements, Account team,
  Clients, Documents (including which SOW/MSA is currently in force), Shared
  Drive, Portal content & locks, and a Payments placeholder — all as
  sections on one page, not separate nested routes/tabs.
- Opening an engagement (`/admin/companies/[id]/engagements/[engagementId]`)
  is a lean Overview form (title/fee/dates/scope/milestones/stakeholder) with
  a "Mark as completed" action — completing one frees the company up to
  start a new active engagement (enforced at the DB level, not just the UI).
- Team roster CRUD, Portal content (global copy), and Staff account
  management (super-admin only) live under **Settings**
  (`/admin/settings/*`), reached only via the account-menu dropdown (also
  has Help) — not the primary nav.

Getting a login: no self-serve signup — a super-admin invites staff from
`/admin/settings/staff` (branded email, same magic-link pattern as clients,
landing on a set-password page).

Known gap: delete works for companies, clients, documents, and team members,
but if something is still referenced, the delete fails with a translated
error rather than corrupting data — it doesn't yet say exactly what's
blocking it.

## Adding a new client engagement (the real, current flow)

1. `/admin/companies`: add the company, if new.
2. On that company's page: add the client (signatory) and the SOW/MSA
   document content, if new — both live as sections on the company page now,
   not separate top-level admin pages.
3. `/admin/companies/[id]/engagements/new`: create the engagement (client,
   title, fee, dates, schedule). The portal slug is only asked for on a
   company's **first-ever** engagement — every engagement after that reuses
   the existing slug automatically.
4. On the company page: assign the account team, pick which SOW/MSA is
   currently in force, set the Shared Drive URL and portal tab-lock
   behavior — all standing settings for the brand, not re-entered per
   engagement.

A repeat engagement for an existing company reuses everything already set
up — only the lean engagement-specific fields (title/fee/dates/scope) are
new.

## Cal.com scheduling

One shared event type for everyone, via the `CAL_COM_EVENT_LINK` env var,
not per-engagement data. Each engagement's "kickoff earliest date" opens the
embedded calendar to that month by default via Cal.com's `month=YYYY-MM`
parameter. Soft default only — doesn't hard-block earlier dates; real
calendar availability handles that naturally.

## QuickBooks invoicing: the actual current behavior

Single-tenant integration — there is exactly one QuickBooks connection for
the whole app (Fonder's own company, `quickbooks_connection` singleton
table), not one per client. An admin creates a real invoice per engagement
from the engagement detail page (`CreateInvoiceForm.tsx` →
`/api/admin/quickbooks/create-invoice`), which looks up/creates a QuickBooks
Customer for the company (`companies.qb_customer_id`), creates a real
Invoice for `engagements.total_fee_amount` (a structured numeric field,
separate from the free-text `total_fee` display string), and requests a
hosted `InvoiceLink` (`?include=invoiceLink&minorversion=65`) — the client
pays on QuickBooks' own page, no card data ever touches this app.

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

The OAuth connect flow (`/admin/settings/quickbooks`, super-admin only) runs
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
invoice(s) it applied to, and sets `engagements.invoice_paid_at` once that
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

1. Supabase's MCP tooling (used by AI coding assistants) cannot reach the
   live project (`ifddezqyozounhilkfgp`) — only unrelated/stale projects are
   visible to it. Schema changes ship as numbered SQL files at the repo root
   (`supabase-setup.sql`, `-stage2-` through `-stage6-` and beyond), run
   manually in the Supabase SQL editor — there's no `supabase/migrations/`
   directory convention here.
2. Changing environment variables doesn't restart anything on Vercel — you
   must explicitly trigger a redeploy afterward.
3. Supabase's API layer can report "column not found" even when the column
   genuinely exists. A stale schema cache, not a real problem. Fix: run
   `NOTIFY pgrst, 'reload schema';` in the SQL Editor.
4. DocuSeal's webhook signature must be verified against the **raw request
   body bytes**, not a re-parsed/re-serialized JSON object — the webhook
   handler reads `req.text()` before `JSON.parse`, deliberately in that
   order.
5. QuickBooks' refresh_token value rotates on every refresh call (not just
   the access token) — always persist the newest refresh_token returned, or
   the next refresh call fails even though the ~100-day validity window
   hasn't actually expired.
6. QuickBooks webhooks moved to a CloudEvents payload format (a JSON array
   of envelopes) as of a mandatory migration deadline that has already
   passed — the legacy `eventNotifications`/`dataChangeEvent` shape is not
   what ships today; `app/api/webhooks/quickbooks/route.ts` is written
   against the new format.
7. QuickBooks' `InvoiceLink` field is null unless the invoice has `BillEmail`
   set (customer-level email alone isn't enough), and the URL it returns
   404s as-is — swap `developer.intuit.com/comingSoonview/` for
   `connect.intuit.com/t/` (same hash) to get the real page. Both handled in
   `lib/quickbooks.ts`'s `createInvoice()`.
8. QuickBooks' sandbox does not actually process card payments through the
   hosted invoice page — the documented mock test cards are for the direct
   Payments API only; clicking through the checkout UI always declines. Not
   fixable from this app's side; only testable for real once live with
   production keys.

The Documenso/Railway/R2-specific gotchas from before this migration (S3
transport requirements, Playwright/Chromium version pinning, Docker-only
deploys) no longer apply — that infrastructure is gone.

## What's built vs. what's intentionally stubbed

Fully real and working:
- Companies, clients, documents, team members: full add/edit/delete,
  reusable entities, now organized as company-scoped sections rather than
  flat top-level admin pages.
- One active engagement per company, enforced at the DB level.
- Native Markdown rendering with automatic section numbering via CSS
  counters.
- Embedded DocuSeal signing per document, independently, with inline
  auto-detected field placement and one-click remembered signatures
  (pending the account/webhook setup noted above).
- Real, DB-persisted signing-completion tracking, driving real tab-unlock
  state (no longer resets on refresh).
- Unified staff/client Supabase Auth, magic-link client access, staff
  invite flow, super-admin-gated staff management.
- Real Cal.com scheduling embed.
- Centralized, globally-editable portal copy.
- Company-scoped admin dashboard with a brand picker.
- QuickBooks invoicing: real single-tenant OAuth connection, real invoice
  creation with a hosted QuickBooks pay link, real webhook-driven payment
  tracking (pending the account/webhook setup noted above).

Deliberately stubbed, not forgotten:
- The client portal app's actual functionality beyond Onboarding/Shared
  Drive/Invoices (Tasks, Chat, Deliverables, Change Request). Real routes,
  nav, and lock behavior exist; no real data or logic yet.
- "Brand HQ" — discussed as a future admin/portal nav concept, explicitly
  deferred, not built anywhere yet.

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
