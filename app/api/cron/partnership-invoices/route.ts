import { NextRequest, NextResponse } from "next/server";
import { listActivePartnershipCompanies, ensureCurrentBillingCycle } from "@/lib/company-billing";

// Invoked monthly by Vercel Cron (see vercel.ts) -- creates this month's
// draft QuickBooks invoice for every partnership-type company.
// ensureCurrentBillingCycle is idempotent per (company, calendar month), so
// this is also safe to trigger manually (e.g. via curl) for testing.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companies = await listActivePartnershipCompanies();
  const results = await Promise.all(
    companies.map(async (c) => ({
      companyId: c.companyId,
      companyName: c.companyName,
      ...(await ensureCurrentBillingCycle(c)),
    })),
  );

  return NextResponse.json({ success: true, results });
}
