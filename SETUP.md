# Fonder Client Portal — Project Status & Handoff

Last updated: July 30, 2026
Status: **Live and working** for Coros (first real client) — currently mid-rollout of
embedded per-document signing (see below); Coros needs to be re-entered with
Markdown content and re-tested against the new flow.

This document exists so anyone — including future-you — can pick this up without
having to reconstruct decisions from scratch. Read this before touching the code.

---

## What this is

A branded client onboarding + e-signature portal, replacing the old
generate-a-PDF-and-email-it workflow. A new client gets a link
(`/portal/[their-slug]`), sees a welcome page with their account team and what
to expect next, then reviews and signs their SOW and MSA — as two separate
documents, each with its own signing session.

## Architecture (six separate services, all necessary)

| Service | What it does | Where it's hosted |
|---|---|---|
| **This Next.js app** | The branded portal + admin intake form | Vercel |
| **Supabase** (`fonder-client-portal` project) | Stores engagement/client data, team members, and each client's SOW/MSA content as Markdown. Also provides real login for the admin pages. | Supabase (project ref `drkppwjcfxyeeuescwov`) |
| **`fonder-pdf-renderer`** (separate small service, source lives alongside this project) | Takes HTML, returns a PDF. Its only job — generic and reusable, no SOW-specific logic lives here. Called at the moment someone starts signing a specific document, using freshly-generated HTML built from that client's stored Markdown. | Self-hosted on Railway (needs real Playwright/Chromium — doesn't run on Vercel) |
| **Documenso** | The actual legal signing engine — creates documents, places signature fields, captures signatures | Self-hosted on Railway |
| **Cloudflare R2** | File storage for Documenso | Cloudflare |
| **Resend** | Sends Documenso's own emails | Already existed for other Fonder email needs |

## Major architecture change #1: content is Markdown, not an uploaded PDF

Originally, admins uploaded an already-finished SOW+MSA PDF. That's gone. Now:

1. The admin form has two Markdown textareas (SOW content, MSA content) instead of a file upload.
2. The portal page (and each document's own signing page) renders that Markdown **directly,
   natively** — the client reads the actual document, no PDF viewer, no separate file.
3. Only at the moment someone starts signing a specific document does a PDF get generated —
   freshly, from that document's Markdown, via `fonder-pdf-renderer` — and sent to Documenso.
   The client never sees or downloads a PDF until it's the final, fully-executed copy.

**Section numbering is automatic**, via CSS counters (`lib/pdf-template.ts`) — an admin just
writes `## Section Title` in the Markdown and gets a numbered-heading look (01, 02, 03...) with
zero per-section markup required.

**A real consequence of dynamic-length content:** signature field placement can't be hardcoded to
specific page numbers the way it could when every client shared one fixed-length static PDF.
Content length now varies per client (and per document, since SOW and MSA are separate PDFs).
The fix: each document's signature block sits at the very end of that document, and
`app/api/sign/create-session/route.ts` uses `pdf-lib` to read the actual generated PDF's page
count at request time, placing signature fields on whatever that real last page turns out to be
— never a hardcoded number.

## Major architecture change #2: separate embedded signing, not one combined email flow

The SOW and MSA are two fully independent Documenso documents and signing events — not one
combined session. Each has its own "Review & sign" entry point on the portal page
(`components/ReviewAndSignList.tsx`), leading to its own dedicated page
(`/portal/[client]/sign/sow` or `/sign/msa`, via `components/SigningSession.tsx`) that shows just
that document's content, followed by **Documenso's real signing UI embedded directly in an
iframe** — the client signs right there, no email required to complete it.

**How the embedding actually works:** `/api/sign/create-session` creates a Documenso document
(create → upload PDF → place signature fields), then returns the client recipient's `token`
(already part of Documenso's own API response). That token builds
`{DOCUMENSO_URL}/embed/sign/{token}` — Documenso's own dedicated embed route, which explicitly
sets `frame-ancestors *` (confirmed by reading Documenso's source directly), meaning it's designed
on purpose to be iframed from any site.

**On whether this needs a paid Documenso tier: it does not**, for a self-hosted instance like this
one. The embedding feature is gated behind a paywall *only* when
`NEXT_PUBLIC_FEATURE_BILLING_ENABLED=true` is set — Documenso's hosted-SaaS billing flag, which
isn't (and has no reason to be) set on a self-hosted Railway deployment. Confirmed by reading the
actual gating condition in Documenso's source, not assumed.

**One thing that couldn't be fully verified** from a sandbox with no network access to the live
Documenso instance: whether the embed route strictly requires the document to have been "sent"
first. To be safe, `/send` is still called in the background after fields are placed — treated as
non-fatal if it fails, since the embedded flow doesn't otherwise depend on it. Worst case, this
means a redundant email goes out that the client can ignore, since they're already signing
directly in the embedded page. Worth confirming this behaves as expected on the first real test.

**A real open question:** Tom Abrams' (Fonder's) own signature is still handled the old way —
logging into Documenso directly, or via the email Documenso sends him — since the embed page is
built for the client recipient specifically. This wasn't explicitly decided one way or the other;
worth confirming this split (client embedded, Fonder via Documenso's own dashboard) is actually
what's wanted.

## Major architecture change #3: centralized portal copy + first-name greeting

Two more things moved out of hardcoded component text:

- **The client signatory's name is now split into first/last name fields.** The portal greeting
  uses just the first name ("Welcome to Fonder, Jamie") instead of the company name. The combined
  full name is still computed and stored (`client_signatory_name`) for anything that needs it
  (e.g. the Documenso recipient name).
- **All portal copy — the welcome subtitle/closing paragraph, team section headings, what's-next
  steps, review & sign labels — now lives in a `portal_copy` table**, edited once at
  `/admin/content` and applied to every client's portal immediately. `lib/portal-copy-constants.ts`
  holds the hardcoded defaults (used if a key is ever missing from the table); `lib/portal-copy.ts`
  fetches the real values and merges them over the defaults. Template placeholders like
  `{{engagementTitle}}` get substituted per client at render time in the portal page itself.

**Team member icons can now have custom colors** — `icon_bg_color` / `icon_text_color` per team
member, set in the admin form (with a color picker), falling back to the default cream/ink look
if left blank.

**The "Reference material" section (transcript/notes) was removed from the admin form entirely.**
The underlying database columns still exist (harmless, unused) — only the UI was removed.

**The admin form is now split into three sections** instead of one: Client & Company, Engagement
Details, and Document Content — previously all mixed into a single card.

## Major architecture change #4: companies and clients are real, reusable entities

Company name and signatory info used to be typed fresh into every engagement. Now:

- **`companies`** and **`clients`** are their own tables — a company can have multiple client
  contacts, and (eventually) multiple engagements over time without re-entering anything.
- **`/admin/companies`** and **`/admin/clients`** manage these directly — add a company (with
  logo), add a client (person) tied to a company.
- **The engagement form now uses dropdowns**, not free text — select an existing company, then a
  client scoped to that company. Links to "+ New company" / "+ New client" open those pages in a
  new tab for when the one you need doesn't exist yet (then refresh the engagement form to see it).
- **The client logo now lives on the Company**, not the engagement — uploaded once on
  `/admin/companies`, reused automatically for every engagement with that company.
- **The welcome greeting is now also centralized and templated** (`welcome_greeting` in
  `/admin/content`, default: `"Welcome to Fonder, {{clientFirstName}}"`) instead of hardcoded JSX.
- **Team member icon colors are now hex-only, no native color-picker swatch** — a plain text
  field expecting `#rrggbb`, removing any ambiguity from browser-native color picker UIs that
  might expose RGB/HSL modes.

**Known limitation, not yet built:** there's no dropdown/edit flow for *updating* an existing
company or client's details (name, logo, email) after creation — only adding new ones. If Coros's
signatory email changes, for example, that would currently need a direct Supabase edit or a new
client record. Worth building an edit flow on `/admin/companies` and `/admin/clients` if this comes
up in practice.

## Major architecture change #5: Documents as their own entity, company editing, sidebar dashboard

- **`documents` table**: SOW/MSA content, scoped to a company, managed on `/admin/documents`
  independent of any single engagement. The engagement form now selects a SOW and MSA via dropdown
  (scoped to the selected company) instead of pasting Markdown directly — matching the same
  pattern as company/client selection.
- **Company detail/edit page** (`/admin/companies/[id]`): edit name/logo, see every client and
  document belonging to that company in one place. The companies list now links each row here
  instead of being purely a flat list.
- **Real sidebar dashboard layout**: all `/admin/*` pages (except `/admin/login`) now share a
  persistent left sidebar (Dashboard, Companies, Clients, Documents, Portal content), via a Next.js
  route group (`app/admin/(dashboard)/`) — the route group folder name doesn't affect URLs, so
  `/admin/companies` still works exactly as before, just with a shared layout wrapping it now.

**Known limitation, not yet built:** no edit flow for an individual client (person) or document
after creation — only companies have one so far. Same "add new, can't yet edit existing" gap as
before, just narrowed slightly.

## Known gotcha (already fixed on the primary project, worth knowing about)

**Old NOT NULL constraints from before the companies/clients restructuring caused real save
failures.** `client_name`, `client_signatory_name`, and `client_signatory_email` were originally
required fields; once the app stopped populating them (in favor of `company_id`/`client_id`),
every engagement save failed with a not-null constraint violation. Fixed by dropping NOT NULL on
those three columns — they remain in place, harmless and unused, going forward.

## Major architecture change #6: edit/delete everywhere, color presets, back navigation

- **Full edit/delete now exists for companies, clients, and documents** — closing the gap flagged
  in the previous update. `/admin/clients/[id]` and `/admin/documents/[id]` are new detail/edit
  pages, matching the same pattern as the company detail page. Deleting a company cascades to its
  clients and documents (enforced at the database level via `on delete cascade`); deleting
  something still referenced by an engagement fails with a clear error rather than corrupting data
  (Postgres foreign key protection — the delete routes translate the raw constraint error into a
  readable message).
- **Team member icon colors are now a fixed set of 4 presets**, not free-form hex input — clicking
  a swatch sets background+text together as a pair, since they're designed to work as combinations,
  not independently mixed. A ✕ option resets to the default cream/ink look.
- **Every admin page now has a back button** (`components/admin/BackButton.tsx`), using
  `router.back()` — real browser-history navigation rather than a hardcoded "back to X" link, so it
  always goes to wherever the person actually came from.

**Known limitation, not yet built:** company/document/client deletion doesn't warn you *which*
engagements are blocking it — just that something is. If this becomes a real workflow bottleneck,
the next step would be showing the specific blocking engagement(s) by name in that error message.

## Major architecture change #7: team members as their own entity, magic-link access, color bug fix

- **Team members are now a global, reusable roster** (`team_members` table), not typed fresh per
  engagement. `/admin/team` manages the roster (with the same color-preset system as before); the
  engagement form now has a **multi-select checklist** instead of free-text name/role/color rows.
  Assignments live in a proper join table (`engagement_team_assignments`), not duplicated data.
- **Real bug found and fixed: color presets silently discarded one of the two colors.** Clicking a
  preset called `updateTeamMember` twice in the same click handler (once for background, once for
  text) — both calls read from the same stale `values` snapshot, so the second call's computation
  didn't include the first call's change, silently overwriting it. This is why colors "looked
  correct on the backend" (one field actually saved) but didn't visibly apply as a pair. Fixed with
  a new `updateTeamMemberFields` that updates both atomically in one state update — the same class
  of bug is worth watching for anywhere multiple sequential `set()` calls happen in one handler.
- **Magic-link portal access is real now**, not just an open link. New table
  `portal_access_tokens`. Flow: client enters their email on a gate screen (or you trigger it from
  the dashboard's "Send access link" button) → a 30-minute link is emailed via Resend → clicking it
  sets a 30-day session cookie → both the welcome page and the sign pages check that cookie before
  showing anything. The email only ever goes to the client's **registered** address — typing a
  different email won't redirect the link elsewhere, even if someone tries.
- **This app now sends its own email directly** (not just Documenso) — needs a `RESEND_API_KEY`
  environment variable in Vercel, using the same Resend account already in use elsewhere.

**Known limitation, not yet built:** there's no "resend" or "revoke access" action if a token gets
lost or a client's device changes — they'd just request a fresh link via the gate screen, which
works fine, but there's no admin visibility into active sessions or a way to force one out.

## The admin flow

`/admin` — dashboard listing every client, with a link to view their live portal or edit their
info. `/admin/new-client` — create a new one. `/admin/edit/[slug]` — edit an existing one,
pre-filled with current data (the portal slug can't be changed here — create a new client instead
if that needs to change). All of this is protected by real Supabase login, not a shared password.

Enter company name, client signatory name/email, account team, total fee, final delivery date, an
optional client logo (shown co-branded next to the Fonder logo on the portal), transcript and
notes (kept for reference only — the actual SOW/MSA drafting still happens via a Claude
conversation using the `fonder-sow-builder` skill, not this form), and paste the finalized SOW and
MSA content as Markdown. Submitting it writes directly to Supabase — no code editing, no GitHub, no
redeploy needed to add or update a client, and no PDF to prepare beforehand.

**Getting a login:** there's no self-serve signup — a team member's account has to be created
directly in the Supabase dashboard (Authentication → Users → Add User), by someone who already has
access to the Supabase project.

## Where the secrets live (NOT in this repo, on purpose)

| Secret | Lives in |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel → Settings → Environment Variables |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel → Settings → Environment Variables (from Supabase → Settings → API — never commit it, it bypasses all row-level security) |
| `DOCUMENSO_URL`, `DOCUMENSO_API_KEY` | Vercel → Settings → Environment Variables |
| `PDF_RENDER_SERVICE_URL` | Vercel → Settings → Environment Variables (the Railway URL of `fonder-pdf-renderer`) |
| `PDF_RENDER_API_KEY` | Vercel → Settings → Environment Variables (must match `RENDER_API_KEY` set on the `fonder-pdf-renderer` Railway service itself) |
| `RESEND_API_KEY` | Vercel → Settings → Environment Variables (this app's own Resend key, for magic-link emails — separate from Documenso's own Resend config on Railway) |
| R2 credentials (`NEXT_PRIVATE_UPLOAD_*`) | Railway → documenso-web → Variables |
| `NEXT_PRIVATE_RESEND_API_KEY` | Railway → documenso-web → Variables |

**For a teammate to actually pick this up, code access alone is not enough.** They need to be
added as a collaborator/member on:
- GitHub (this repo, and `fonder-pdf-renderer`'s repo)
- Vercel (the project)
- Railway (the project — both Documenso and `fonder-pdf-renderer` live there)
- Cloudflare (for the R2 bucket, if they'll ever need to touch storage config)
- Documenso itself (its own login, separate from all of the above)

If you can't add someone directly to all of these, at minimum put the actual secret values
somewhere secure (a password manager shared vault) — GitHub should never hold them.

## Known gotchas (things that broke during setup, and why)

These aren't hypothetical — each of these actually happened and cost real debugging time:

1. **Documenso (and `fonder-pdf-renderer`) won't deploy to Vercel.** Both are Docker-based.
   Railway or Render only.
2. **First deploy attempts can fail on healthcheck** even when build/deploy steps succeed —
   usually a race condition with Postgres not being fully ready yet. A plain redeploy often
   fixes it.
3. **Documenso needs S3-compatible storage, not just a database**, because this integration uses
   the presigned-upload-URL API flow. Without `NEXT_PUBLIC_UPLOAD_TRANSPORT=s3` and real R2/S3
   credentials, document creation fails with `"Create document is not available without S3
   transport."`
4. **Signature fields are a separate API step.** Creating and uploading a document does NOT
   automatically add signature fields — Documenso requires fields to be explicitly created via
   `/api/v1/documents/:id/fields` before it will send, with `"Signers must have at least one
   signature field"` otherwise.
5. **Editing environment variables doesn't restart anything by itself** — on both Railway and
   Vercel, you have to explicitly trigger a redeploy after changing variables.
6. **Any client created before the Markdown/embedding changes needs to be re-entered.** Coros's
   original data lived in a hardcoded code file (deleted), then briefly in an uploaded-PDF flow
   (also replaced). Their SOW/MSA content needs to be pasted as Markdown via `/admin/edit/coros`
   before their portal will show anything or allow signing.
7. **Supabase's API layer can report "column not found" even when a column genuinely exists** —
   this is a stale schema cache, not a real problem. Fix: run `NOTIFY pgrst, 'reload schema';` in
   the SQL Editor.
8. **Local testing quirk, not a real bug:** running `fonder-pdf-renderer` locally outside Docker
   can hit a Playwright/Chromium version mismatch (a freshly-installed Playwright expects a newer
   Chromium than what might be cached, and modern Chromium builds dropped old headless mode
   entirely, needing the separate `chrome-headless-shell` binary). Doesn't affect the actual
   deployed service, which uses the official versioned Playwright Docker image where the library
   and browser are guaranteed to match.

## What's built vs. what's intentionally stubbed

**Fully working:**
- Welcome page, team intro (real names), what's-next, per-document review & sign — all branded in
  Fonder's real product design system (cream/near-black/warm-gray, rounded corners, pill buttons)
- Native Markdown rendering with automatic section numbering
- Real Documenso integration per document: creates it, places signature fields, embeds real
  signing UI directly in the portal

**Deliberately NOT built (decided together, not forgotten):**
- **Live status on the portal itself.** Revisiting `/portal/coros` won't show "already signed" —
  no persistence layer or status check built yet.
- **The webhook receiver** (`app/api/webhooks/documenso/route.ts`) exists and can be configured in
  Documenso (Settings → Webhooks → "Document Completed"), but currently just logs the event and
  does nothing else. Natural next step if live status ever becomes worth building: add a status
  record per client/document in Supabase and have this route update it.

## Adding a new client

Go to `/admin/new-client` (requires being logged in), fill out the form — including pasting SOW
and MSA content as Markdown — submit. No code changes, no GitHub, no redeploy needed.

## Open items, unresolved on purpose (not bugs)

- Coros's SOW still states an open scope question: 3 features are confirmed, but the engagement
  allows for 3–5, and the identity of any 4th/5th feature was never pinned down with the client.
  Worth resolving with Coros directly — not something to guess at in code.
