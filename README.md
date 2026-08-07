# Fonder Client Portal

A branded client onboarding, e-signature, and project-tracking portal for
Fonder Studio, plus the admin dashboard staff use to run it. Next.js (App
Router) on Vercel, Supabase for data/auth/storage, DocuSeal for signing.

**For the actual state of the system** — what's real vs. stubbed, the data
model, known gotchas, where secrets live — read [`SETUP.md`](./SETUP.md).
This file is just how to get it running locally; that one is the living
source of truth.

## Local development

```bash
npm install
vercel env pull .env.local   # or copy .env.local from a teammate/password manager
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Admin dashboard is at
`/admin` (staff sign in with Google — see `SETUP.md`'s "Staff auth"
section); the client portal is at `/portal/[slug]`.

## Stack

- **Next.js 16** (App Router, Turbopack) — note the version: APIs and
  conventions have changed from what most training data expects (e.g.
  `middleware.ts` → `proxy.ts`). See `AGENTS.md` before writing new code.
- **Supabase** — Postgres, Auth (staff via Google Workspace SSO, clients via
  magic link), and Storage.
- **DocuSeal** — e-signing, embedded directly in the portal.
- **shadcn/ui** (Radix) — the admin/portal shell and component primitives.
- **Vercel** — hosting, deploys on push to `main`.

## Deploying

Push to `main` deploys to production automatically via Vercel. There's no
separate staging environment — test locally against the same Supabase
project first (see `SETUP.md`'s gotchas before assuming something that
works locally will behave identically on Vercel).
