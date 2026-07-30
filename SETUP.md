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

## Architecture (four separate services, all necessary)

| Service | What it does | Where it's hosted |
|---|---|---|
| **This Next.js app** | The branded portal itself — everything the client sees | Vercel |
| **Documenso** | The actual legal signing engine — creates documents, places signature fields, captures signatures, sends signing emails | Self-hosted on Railway (Documenso does NOT run on Vercel — it needs Docker, which Vercel doesn't support) |
| **Cloudflare R2** | File storage for Documenso — required for the API flow used here (Documenso's default "database" storage mode doesn't support the presigned-upload-URL pattern the API needs) | Cloudflare |
| **Resend** | Sends Documenso's own emails (signing requests, completion notices) | Already existed for other Fonder email needs; just pointed Documenso at it |

None of these four are optional — this app can't sign documents without all four
being correctly configured and talking to each other.

## Where the secrets live (NOT in this repo, on purpose)

| Secret | Lives in |
|---|---|
| `DOCUMENSO_URL`, `DOCUMENSO_API_KEY` | Vercel → Settings → Environment Variables |
| R2 credentials (`NEXT_PRIVATE_UPLOAD_*`) | Railway → documenso-web → Variables |
| `NEXT_PRIVATE_RESEND_API_KEY` | Railway → documenso-web → Variables |
| `RESEND_API_KEY` (if this app ever sends its own email directly) | Vercel → Settings → Environment Variables |

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

One file, one folder — no other code changes needed:

1. Add an entry to `lib/engagements.ts` (client name, fee, dates, team, and
   critically: `clientSignatoryEmail` — a real email, or Documenso will try to
   send to a placeholder)
2. Drop the final, client-approved SOW+MSA PDF (merged into one file) into
   `/documents/[slug]-sow-msa.pdf`
3. Send them `https://[your-domain]/portal/[slug]`

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
