import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireAdmin } from "@/lib/supabase/server";
import { recordTestPayment } from "@/lib/quickbooks";

// Testing-only escape hatch: QuickBooks' sandbox does not actually process
// card payments through the hosted invoice page (see SETUP.md), so there's
// no way to click through to a genuinely-paid invoice there. This records a
// real Payment via the QuickBooks API instead (a real accounting entry, not
// a mock), which is exactly why it's hard-blocked outside sandbox below --
// this must never be reachable once QUICKBOOKS_ENVIRONMENT is "production".
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  if (process.env.QUICKBOOKS_ENVIRONMENT === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const body = await req.json();
  const { companyId } = body;
  if (!companyId) {
    return NextResponse.json({ error: "companyId is required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: company, error } = await supabase
    .from("companies")
    .select("id, qb_invoice_id, total_fee_amount, invoice_paid_at, qb_customer_id")
    .eq("id", companyId)
    .single();

  if (error || !company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  if (company.invoice_paid_at) {
    return NextResponse.json({ success: true });
  }

  if (!company.qb_invoice_id || !company.total_fee_amount) {
    return NextResponse.json({ error: "This company has no invoice to simulate a payment for" }, { status: 400 });
  }

  if (!company.qb_customer_id) {
    return NextResponse.json({ error: "No QuickBooks customer on file for this company" }, { status: 400 });
  }

  try {
    await recordTestPayment({
      customerId: company.qb_customer_id,
      invoiceId: company.qb_invoice_id,
      amount: company.total_fee_amount,
    });

    await supabase
      .from("companies")
      .update({ invoice_paid_at: new Date().toISOString() })
      .eq("id", companyId);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to simulate payment",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
