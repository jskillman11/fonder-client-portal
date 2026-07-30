# Fonder Client Portal — Project Status & Handoff

Last updated: July 30, 2026
Status: **Live and working** for Coros (first real client)

This document exists so anyone — including future-you — can pick this up without
having to reconstruct decisions from scratch. Read this before touching the code.

---

## What this is

A branded client onboarding + e-signature portal, replacing the old
generate-a-PDF-and-email-it workflow. A new client gets a link
(`/portal/[their-slug]`), sees a welcome page with their account team and what
to expect next, then reviews and signs their SOW + MSA (merged into one PDF)
in a single session.

## Architecture (six separate services, all necessary)

| Service | What it does | Where it's hosted |
|---|---|---|
| **This Next.js app** | The branded portal + admin intake form | Vercel |
| **Supabase** (`fonder-client-portal` project) | Stores engagement/client data, team members, and each client's SOW/MSA content as Markdown. Also provides real login for the admin pages. | Supabase (project ref `drkppwjcfxyeeuescwov`) |
| **`fonder-pdf-renderer`** (separate small service, source lives alongside this project) | Takes HTML, returns a PDF. Its only job — generic and reusable, no SOW-specific logic lives here. Called at the moment someone clicks "sign," using freshly-generated HTML built from that client's stored Markdown. | Self-hosted on Railway (needs real Playwright/Chromium, same reasoning as Documenso below — doesn't run on Vercel) |
| **Documenso** | The actual legal signing engine — creates documents, places signature fields, captures signatures, sends signing emails | Self-hosted on Railway |
| **Cloudflare R2** | File storage for Documenso | Cloudflare |
| **Resend** | Sends Documenso's own emails | Already existed for other Fonder email needs |

## Major architecture change: content is Markdown, not an uploaded PDF

Originally, admins uploaded an already-finished SOW+MSA PDF. That's gone. Now:

1. The admin form has two Markdown textareas (SOW content, MSA content) instead of a file upload.
2. The portal page renders that Markdown **directly, natively** — the client reads the actual
   document in the page itself, no PDF viewer, no separate file.
3. Only at the moment of signing does a PDF get generated — freshly, from that same Markdown,
   via `fonder-pdf-renderer` — and sent to Documenso. The client never sees or downloads a PDF
   until it's the final, fully-executed copy.

**Section numbering is automatic**, via CSS counters (`lib/pdf-template.ts`) — an admin just
writes `## Section Title` in the Markdown and gets the same numbered-heading look (01, 02, 03...)
as the earlier hand-built version, with zero per-section markup required.

**One real consequence of dynamic-length content:** signature field placement used to be
hardcoded to specific page numbers (page 4, page 7), because every client shared one fixed-length
static PDF. That doesn't work anymore — content length varies per client. The fix: the combined
signature block always sits at the very end of the whole document (after both SOW and MSA
content, not one per document), and `app/api/sign/route.ts` uses `pdf-lib` to read the actual
generated PDF's page count at request time, placing both signature fields on whatever that real
last page turns out to be — never a hardcoded number.

## The admin flow

`/admin` — dashboard listing every client, with a link to view their live
portal or edit their info. `/admin/new-client` — create a new one.
`/admin/edit/[slug]` — edit an existing one, pre-filled with their current
data (the portal slug itself can't be changed here, since it's the client's
live link — create a new client instead if that needs to change). Uploading
a new PDF is optional when editing; leave it blank to keep the existing file.
All of this is protected by real Supabase login, not a shared password.

Enter company name, client signatory name/email, account team, total fee,
final delivery date, an optional client logo (shown co-branded next to the
Fonder logo on their portal), transcript and notes (kept for reference only
— the actual SOW/MSA drafting still happens via a Claude conversation using
the `fonder-sow-builder` skill, not this form), and paste the finalized SOW
and MSA content as Markdown. Submitting it writes directly to Supabase — no
code editing, no GitHub, no redeploy needed to add or update a client, and
no PDF to prepare beforehand.

**Getting a login:** there's no self-serve signup — a team member's account
has to be created directly in the Supabase dashboard (Authentication → Users
→ Add User), by someone who already has access to the Supabase project.

## Where the secrets live (NOT in this repo, on purpose)

| Secret | Lives in |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel → Settings → Environment Variables |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel → Settings → Environment Variables (get this from Supabase → Settings → API — never commit it, it bypasses all row-level security) |
| `DOCUMENSO_URL`, `DOCUMENSO_API_KEY` | Vercel → Settings → Environment Variables |
| `PDF_RENDER_SERVICE_URL` | Vercel → Settings → Environment Variables (the Railway URL of `fonder-pdf-renderer`) |
| `PDF_RENDER_API_KEY` | Vercel → Settings → Environment Variables (must match `RENDER_API_KEY` set on the `fonder-pdf-renderer` Railway service itself) |
| R2 credentials (`NEXT_PRIVATE_UPLOAD_*`) | Railway → documenso-web → Variables |
| `NEXT_PRIVATE_RESEND_API_KEY` | Railway → documenso-web → Variables |

**For a teammate to actually pick this up, code access alone is not enough.**
They need to be added as a collaborator/member on:
- GitHub (this repo)
- Vercel (the project)
- Railway (the project — this is where Documenso itself lives)
- Cloudflare (for the R2 bucket, if they'll ever need to touch storage config)
- Documenso itself (its own login, separate from all of the above — this is
  where webhooks, API tokens, and the actual document/signing dashboard live)

If you can't add someone directly to all of these, at minimum put the actual
secret values somewhere secure (a password manager shared vault) — GitHub
should never hold them.

## Known gotchas (things that broke during setup, and why)

These aren't hypothetical — each of these actually happened and cost real
debugging time. Worth knowing before they happen again on a new client or
new environment:

1. **Documenso won't deploy to Vercel.** It's Docker-based. Railway or Render
   only.
2. **First deploy attempts can fail on healthcheck** even when build/deploy
   steps succeed — usually a race condition with Postgres not being fully
   ready yet. A plain redeploy often fixes it.
3. **Documenso needs S3-compatible storage, not just a database**, specifically
   because this integration uses the presigned-upload-URL API flow
   (`createDocument` → upload → `send`). Without `NEXT_PUBLIC_UPLOAD_TRANSPORT=s3`
   and real R2/S3 credentials, document creation fails with
   `"Create document is not available without S3 transport."`
4. **Signature fields are a separate API step.** Creating and sending a
   document does NOT automatically add signature fields — Documenso will
   refuse to send with `"Signers must have at least one signature field."`
   Fields have to be explicitly created via `/api/v1/documents/:id/fields`
   after upload, before send. See `app/api/sign/route.ts` for the working
   version of this.
5. **Editing environment variables doesn't restart anything by itself** — on
   both Railway and Vercel, you have to explicitly trigger a redeploy after
   changing variables, or the old values keep running.
6. **The full "sign right inside your branded portal" experience** (no email
   hop at all) would require Documenso's embedding SDK, which is typically a
   paid/enterprise feature. What's built instead: the portal triggers the
   send, the client finishes signing via the email Documenso sends them. This
   was a deliberate scope decision, not an oversight.
7. **Coros needs to be re-entered through `/admin/new-client` after this
   update.** Coros's data used to live in a hardcoded code file
   (`lib/engagements.ts`, now deleted). After moving to Supabase, that data
   doesn't exist in the database yet — Coros needs to be created fresh through
   the new admin form (including re-uploading the PDF) before their portal
   link will work again.
8. **Content moved from an uploaded PDF to pasted Markdown.** Coros (and any
   client created before this change) needs their SOW/MSA content re-entered
   as Markdown in `/admin/edit/coros` — the old PDF upload no longer exists as
   a field, so their portal will show blank document sections until this is
   done.
9. **Local testing quirk, not a real bug:** if anyone ever tries to run
   `fonder-pdf-renderer` locally outside Docker, a freshly-`npm install`ed
   Playwright can expect a newer Chromium revision than what's cached, and
   modern Chromium builds have dropped the old headless mode entirely
   (needing the separate `chrome-headless-shell` binary instead). None of this
   affects the actual deployed service, since the Dockerfile uses the official
   versioned Playwright image where the library and browser are guaranteed to
   match — this only matters if someone tries to skip Docker for local
   debugging.

## What's built vs. what's intentionally stubbed

**Fully working:**
- Welcome page, team intro (real names), what's-next, review & sign — all
  branded in Fonder's real product design system (cream/near-black/warm-gray,
  rounded corners, pill buttons — same system as the Fonder HQ sign-in email)
- Real Documenso integration: creates the combined SOW+MSA document, places
  signature fields for both signers, sends the actual signing emails
- Documenso's own completion emails to both parties

**Deliberately NOT built (decided together, not forgotten):**
- **Live status on the portal itself.** If someone revisits `/portal/coros`
  after signing, it won't show "already signed" — there's no persistence layer
  or status check built. Documenso's own emails cover this instead.
- **The webhook receiver** (`app/api/webhooks/documenso/route.ts`) exists and
  is correctly configured in Documenso (Settings → Webhooks → "Document
  Completed" event → pointed at this app's `/api/webhooks/documenso`), but it
  currently just logs the event and does nothing else. If live status ever
  becomes worth building, this is the hook point — the natural next step
  would be adding Supabase to store a status record per client, and having
  this route update it.

## Adding a new client

Go to `/admin/new-client` (requires being logged in), fill out the form, upload
the final merged SOW+MSA PDF, submit. That's it — no code changes, no GitHub,
no redeploy. This replaced the old process of hand-editing `lib/engagements.ts`
and dragging PDFs into GitHub's web UI, which is exactly the workflow this
skill was built to eliminate.

**One thing to double check for any new client:** the signature field
placement in `app/api/sign/route.ts` is hardcoded to page 4 and page 7
(matching Coros's specific 4-page SOW + 3-page MSA). If a future client's
SOW or MSA is a different length, those page numbers need to be adjusted —
this isn't currently automatic.

## Open items, unresolved on purpose (not bugs)

- Coros's SOW still has an open scope question: 3 features are confirmed,
  but the engagement allows for 3–5, and the identity of any 4th/5th feature
  was never pinned down with the client. Worth resolving with Coros directly
  — not something to guess at in code.
