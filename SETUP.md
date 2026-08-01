# Fonder Client Portal — Project Status & Handoff

Last updated: July 31, 2026
Status: **Live for Coros** (first real client). Core signing flow works end to end
(create, send, sign via email, Documenso completion). A large new area, the
authenticated client portal app (tasks, chat, invoices, etc.), is scaffolded
but intentionally not functional yet. See "What's built vs. stubbed" below.

This document describes the **current state of the system**, not the history
of how it got here. Read this before touching the code, especially in a fresh
Claude Code session with no memory of this conversation.

---

## What this is

A branded client onboarding, e-signature, and (eventually) project-tracking
portal for Fonder Studio, replacing the old generate-a-PDF-and-email-it
workflow.

A client gets a link (/portal/[slug]), unlocks it with a magic-link email (or
an admin can preview it directly, no link needed), and sees: an overview of
the engagement (scope, schedule, fee), their account team, and a 4-step
action list: review and sign, pay a deposit, schedule kickoff, access an
ongoing client portal. The SOW and MSA are two independent documents, each
signed via its own Documenso session, triggered by email rather than an
embedded widget (see "Signing flow" below for why).

## Architecture

| Service | What it does | Where it's hosted |
|---|---|---|
| This Next.js app | The branded client portal plus the full admin dashboard | Vercel |
| Supabase (fonder-client-portal project, ref drkppwjcfxyeeuescwov) | All structured data plus file storage plus admin login | Supabase |
| fonder-pdf-renderer (separate sibling repo) | Generic HTML to PDF service, called when a client clicks sign | Railway (needs real Chromium, not Vercel) |
| Documenso | The actual e-signature engine | Self-hosted on Railway |
| Cloudflare R2 | File storage for Documenso's own upload flow | Cloudflare |
| Resend | Sends both Documenso's signing emails and this app's magic-link emails | Existing Fonder Resend account |
| Cal.com | Real scheduling calendar for the kickoff step | Existing Fonder Cal.com account |

None of these are optional. Missing any one breaks the create-and-sign flow.

## Data model

- companies: a client organization (name, logo), reusable across engagements.
- clients: a real person (first/last name, email), belonging to a company.
- documents: SOW or MSA content in Markdown, scoped to a company, reusable.
- team_members: Fonder's own staff roster, global, not scoped to a company.
- engagements: the project record. Slug is the portal URL. Links to one
  company, one client, one SOW document, one MSA document, plus title, fee,
  final delivery date, kickoff earliest date, scope summary.
- engagement_team_assignments: join table, which team members show on which
  engagement's portal.
- engagement_milestones: label plus date pairs shown in Overview's schedule.
- portal_copy: every piece of client-facing text as editable key/value rows,
  with hardcoded fallbacks in lib/portal-copy-constants.ts.
- portal_access_tokens: magic-link tokens for client portal access.

A few columns exist on engagements but are unused, left in place rather than
destructively dropped across earlier refactors: client_name,
client_signatory_name, client_signatory_email, document_storage_path
(reserved for a future signed-PDF download feature), sow_content_markdown and
msa_content_markdown (superseded by the documents table). Harmless to ignore.

## The client-facing portal (/portal/[slug])

Four sections, top to bottom:

1. Welcome: co-branded logo, templated greeting using the client's first name.
2. Overview: scope summary, schedule list, total fee, final delivery date.
3. Team: whichever team members are assigned.
4. What's Next, four steps, each its own bordered block:
   - Review and sign: real buttons, one per document. See "Signing flow" below.
   - Invoice and deposit: a visibly disabled placeholder, no Quickbooks yet.
   - Schedule kickoff: a real embedded Cal.com calendar.
   - Access your client portal: links into /portal/[slug]/app (see below).

Steps 2 through 4 grey out until step 1's documents are both marked sent.
This lock is client-side React state only, not persisted. A page refresh
resets it even if the client already triggered the sign emails. Fixing this
properly means tracking real completion server-side. The Documenso webhook
receiver exists for this but does not update anything yet.

## Signing flow: the actual current behavior

Clicking "Review and sign" calls /api/sign/create-session directly and
changes the button to "Email sent." No page navigation happens. Under the
hood: that route generates a PDF fresh from the document's Markdown via
fonder-pdf-renderer, creates a Documenso document, uploads the PDF, places a
signature field for both the client and Tom Abrams (using pdf-lib to find the
actual last page, since content length varies per client and is never
hardcoded), then sends it, which triggers Documenso's own signing email.

There is a separate, embedded-iframe signing page at
/portal/[slug]/sign/[docType] (component SigningSession.tsx), built earlier
using Documenso's real /embed/sign/{token} route (confirmed via their source
to not require a paid tier on self-hosted instances). This page is currently
orphaned. Nothing in the UI links to it, because the iframe approach wasn't
confirmed reliably working in practice, while the email fallback demonstrably
does. It's kept in place in case it's worth debugging later, not because
it's part of the live flow.

SOW and MSA are two fully independent Documenso documents and emails, not one
combined signature.

## Client-facing auth (magic links)

The portal and the /app area require either:

- A valid magic-link session: the client enters their email on a gate screen,
  or an admin triggers it via "Send access link" on the dashboard. A
  30-minute link goes out via Resend; clicking it sets a 30-day session
  cookie. The email only ever goes to the client's registered address.
- An active admin session: logged into /admin lets you view any client's
  portal directly, via isAdminSession() in lib/supabase/server.ts.

There's no revoke or resend admin action yet if a client loses their link;
they just request a fresh one, which works fine, but there's no visibility
into active sessions.

## The client portal app (/portal/[slug]/app/*)

A separate authenticated area, linked from What's Next step 4. Real routes,
real tab navigation, real auth protection, but every page's content is a
placeholder:

- Home: three placeholder cards (Action items, Next touchpoint, Project
  status), matching the requested structure, no real data.
- Tasks, Project Resources, Chat, Invoices, Deliverables, Signed Documents:
  each a single generic "coming soon" card.
- Change Request: the most fleshed-out placeholder. Real but disabled
  date-picker and priority-selector inputs, plus a description of the
  intended full workflow (affected tasks, new timeline, budget impact,
  accept or decline). Building this for real will need to integrate with the
  existing ClickUp and Google Sheets scheduling sync, a separate already-built
  system.

## The admin dashboard (/admin/*)

Protected by real Supabase login via middleware.ts. All pages except
/admin/login share a persistent left sidebar via a Next.js route group
(app/admin/(dashboard)/, which doesn't affect the URL).

- /admin: lists every engagement, view portal, edit, send access link.
- /admin/companies and /admin/companies/[id]: add, edit, delete companies.
- /admin/clients and /admin/clients/[id]: add, edit, delete clients.
- /admin/documents and /admin/documents/[id]: add, edit, delete SOW/MSA content.
- /admin/team and /admin/team/[id]: add, edit, delete team roster members.
- /admin/content: edit every piece of client-facing copy, globally.
- /admin/new-client and /admin/edit/[slug]: create or edit an engagement,
  selecting company, client, SOW doc, MSA doc, and team via dropdowns.

Every page has a real back button using router.back().

Getting a login: no self-serve signup, create one directly in Supabase
(Authentication, Users, Add User).

Known gap: delete works for companies, clients, documents, and team members,
but if something is still referenced by an engagement, the delete fails with
a translated error rather than corrupting data. It doesn't yet say which
engagement is blocking it.

## Adding a new client engagement (the real, current flow)

This is not one form. It's four small steps, each reusable for future
engagements:

1. /admin/companies: add the company, if new.
2. /admin/clients: add the signatory, scoped to that company, if new.
3. /admin/documents: add the SOW and MSA content as Markdown, if new.
4. /admin/new-client: create the engagement, picking company, client, SOW
   doc, and MSA doc from dropdowns, plus slug, title, fee, dates, schedule,
   team.

Steps 1 through 3 only need doing once per company, client, or document. A
repeat engagement for an existing company reuses what's already there.

## Cal.com scheduling

One shared event type for everyone, via the CAL_COM_EVENT_LINK env var, not
per-engagement data. Each engagement's "kickoff earliest date" opens the
embedded calendar to that month by default, via Cal.com's real month=YYYY-MM
parameter, confirmed by reading their actual booking-page source. This is a
soft default only. It does not hard-block earlier dates from being selected;
that would need date-range limits set on the event type itself, inside
Cal.com. In practice, real calendar availability handles this naturally.

## Where the secrets live, not in this repo, on purpose

| Secret | Lives in |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY | Vercel |
| SUPABASE_SERVICE_ROLE_KEY | Vercel, bypasses all RLS, never commit it |
| DOCUMENSO_URL, DOCUMENSO_API_KEY | Vercel |
| PDF_RENDER_SERVICE_URL, PDF_RENDER_API_KEY | Vercel, must match RENDER_API_KEY on the fonder-pdf-renderer Railway service |
| RESEND_API_KEY | Vercel, this app's own key, separate from Documenso's Resend config |
| PORTAL_EMAIL_FROM | Vercel, optional, must match a domain verified for RESEND_API_KEY |
| CAL_COM_EVENT_LINK | Vercel |
| R2 credentials (NEXT_PRIVATE_UPLOAD_*) | Railway, documenso-web |
| NEXT_PRIVATE_RESEND_API_KEY | Railway, documenso-web |

For anyone else to actually work on this, code access alone isn't enough.
They need adding as a collaborator on GitHub (both repos), Vercel, Railway
(both services), Cloudflare if touching storage, and Documenso itself. If you
can't add someone directly, put the real secret values in a shared password
manager, never in GitHub.

## Known gotchas, real, already happened

1. Documenso and fonder-pdf-renderer won't deploy to Vercel. Both are
   Docker-based. Railway or Render only.
2. First deploy attempts can fail on healthcheck even when build and deploy
   succeed, usually Postgres not being fully ready yet. A plain redeploy
   often fixes it.
3. Documenso needs S3-compatible storage, not just a database, because this
   integration's presigned-upload-URL flow requires it. Without
   NEXT_PUBLIC_UPLOAD_TRANSPORT=s3 and real R2 credentials, document creation
   fails with "Create document is not available without S3 transport."
4. Signature fields are a separate API step. Uploading a document does not
   automatically add signature fields. Documenso refuses to send without
   them, with "Signers must have at least one signature field."
5. Changing environment variables doesn't restart anything. On both Railway
   and Vercel, you must explicitly trigger a redeploy afterward.
6. Supabase's API layer can report "column not found" even when the column
   genuinely exists. A stale schema cache, not a real problem. Fix: run
   NOTIFY pgrst, 'reload schema'; in the SQL Editor.
7. fonder-pdf-renderer's Playwright version must be pinned exactly to match
   its Dockerfile's base image tag, no caret ranges. A caret range once let
   npm install a newer Playwright than the pinned image's bundled Chromium,
   causing every render to fail with a missing-executable error. Fixed with
   an exact version pin, a committed lockfile, and npm ci instead of npm
   install in the Dockerfile. If you bump one, bump both, together.
8. Old NOT NULL constraints from an earlier schema version caused real save
   failures after the companies and clients refactor stopped populating
   client_name and similar fields. Fixed by dropping those constraints.
   Already applied, just explaining why those columns are nullable now.

## What's built vs. what's intentionally stubbed

Fully real and working:
- Companies, clients, documents, team members: full add, edit, delete, all
  reusable entities selected via dropdown or multi-select on the engagement
  form.
- Native Markdown rendering with automatic section numbering via CSS counters.
- Real Documenso signing per document, independently, with dynamic field
  placement.
- Magic-link client auth plus admin-session bypass.
- Real Cal.com scheduling embed.
- Centralized, globally-editable portal copy.
- Full admin sidebar dashboard.

Deliberately stubbed, not forgotten:
- Live signing-status tracking. The Documenso webhook receiver exists and is
  configured in Documenso, but only logs the event. Nothing persists or
  displays it. This is also why the What's Next step-lock resets on refresh.
- Quickbooks invoicing. Step 2 of What's Next is a disabled placeholder.
- The entire client portal app's actual functionality (tasks, chat, invoices,
  deliverables, signed documents, change requests). Real routes and
  navigation exist, no real data or logic yet.
- Editing an engagement's core links (which company, client, or documents it
  points to) works by re-selecting them in the edit form, but isn't a
  distinct guided flow. The slug itself can't be changed once created, by
  design, since it's the live URL.

## Open items, unresolved on purpose, not bugs

- Coros's SOW still states an open scope question: 3 features are confirmed,
  the engagement allows for 3 to 5, and the identity of any 4th or 5th
  feature was never pinned down with the client. Worth resolving directly
  with Coros, not something to guess at in code.
- Tom Abrams' own signature still goes through Documenso's normal dashboard
  or email. The signing flow described above is written from the client's
  perspective. This wasn't a deliberate design decision so much as where the
  natural split landed; worth a second look if it ever matters.
