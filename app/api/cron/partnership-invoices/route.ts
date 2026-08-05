import { NextRequest, NextResponse } from "next/server";
import { listActivePartnershipEngagements, ensureCurrentBillingCycle } from "@/lib/engagement-billing";

// Invoked monthly by Vercel Cron (see vercel.ts) -- creates this month's
// draft QuickBooks invoice for every active partnership engagement.
// ensureCurrentBillingCycle is idempotent per (engagement, calendar month),
// so this is also safe to trigger manually (e.g. via curl) for testing.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const engagements = await listActivePartnershipEngagements();
  const results = await Promise.all(
    engagements.map(async (e) => ({
      engagementId: e.id,
      companyName: e.companyName,
      ...(await ensureCurrentBillingCycle(e)),
    })),
  );

  return NextResponse.json({ success: true, results });
}
