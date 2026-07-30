# Fonder Client Portal

A branded welcome + review + sign experience for new Fonder Studio clients, built in the full
Fonder HQ design system (the same one used in your Fonder HQ sign-in email).

## What's here

- **`/portal/[client]`** — the actual client-facing page. One route serves every client; content
  comes from `lib/engagements.ts`, keyed by client slug (e.g. `/portal/coros`).
- **Welcome → Team → What's Next → Review & Sign → Confirmation**, all on one scrolling page.
- Fully styled in the real Fonder HQ palette: cream background, near-black text, warm grays,
  rounded cards, pill buttons — no more black/white legal-doc styling. This is the same design
  system as your Fonder HQ magic-link email.

## What's a placeholder right now

The "Review & sign" button currently **simulates** signing (a short delay, then shows the
confirmation screen) — it is NOT wired to a real e-signature backend yet. See the `TODO(integration)`
comment in `components/DocumentReview.tsx` for exactly where that gets wired up once Documenso is
live. The rest of the app (welcome page, team intro, next-steps, confirmation) is fully real and
ready to use as-is.

## Adding a new client

Add an entry to `lib/engagements.ts` — that's the only file that needs to change per client. Give
them the link `https://[your-domain]/portal/[slug]`.

## Setup: local development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` — it redirects to `/portal/coros` by default.

## Setup: deploying to Vercel

1. Push this folder to a new GitHub repository.
2. Go to [vercel.com/new](https://vercel.com/new), import that repository.
3. Vercel auto-detects Next.js — no config needed. Click Deploy.
4. Once live, you'll get a URL like `fonder-client-portal.vercel.app` (or connect a custom
   subdomain, e.g. `sign.fonder.studio`, in Vercel's domain settings).

## Setup: self-hosting Documenso (for real e-signature)

This is the piece that still needs to exist before "Review & sign" is real:

1. Documenso is Docker-based, **not** natively deployable to Vercel — deploy it to
   [Railway](https://railway.app) or [Render](https://render.com), both of which support one-click
   Docker deploys and have free tiers sufficient to start.
2. Follow Documenso's self-hosting docs: https://docs.documenso.com/developers/self-hosting
3. Once it's live, you'll have a Documenso instance URL and can generate an API key from its
   settings.
4. Come back and share that URL + API key — the next step is wiring `components/DocumentReview.tsx`
   and a new `app/api/sign/route.ts` to call Documenso's API: create a signing session with your
   client's SOW + MSA, redirect the client into Documenso's signing flow (or embed it), and handle
   the webhook Documenso sends back on completion to trigger your confirmation screen and Resend
   email.

**Note on licensing:** Documenso is AGPLv3. Self-hosting it as-is for your own client signing is
fine; if you end up modifying Documenso's own source (not this portal, which is separate and
unaffected), read the license's network-use clause before doing so.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · no external font loading (uses the same
native system-font stack as the Fonder HQ email, so there's nothing to load — fast by default).
