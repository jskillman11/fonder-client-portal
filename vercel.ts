import type { VercelConfig } from "@vercel/config/v1";

// Creates this month's draft QuickBooks invoice for every active partnership
// engagement -- see app/api/cron/partnership-invoices/route.ts. Requires a
// CRON_SECRET env var (Vercel sends it as `Authorization: Bearer
// $CRON_SECRET` on every cron invocation); the route 401s without it.
export const config: VercelConfig = {
  crons: [{ path: "/api/cron/partnership-invoices", schedule: "0 6 1 * *" }],
};
