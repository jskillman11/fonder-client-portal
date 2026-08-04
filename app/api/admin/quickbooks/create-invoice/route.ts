import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireAdmin } from "@/lib/supabase/server";
import { findOrCreateCustomer, createInvoice } from "@/lib/quickbooks";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const body = await req.json();
  const { engagementId } = body;
  if (!engagementId) {
    return NextResponse.json({ error: "engagementId is required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: engagement, error } = await supabase
    .from("engagements")
    .select(
      "id, engagement_title, total_fee_amount, company_id, companies(id, name, qb_customer_id), clients(email)",
    )
    .eq("id", engagementId)
    .single();

  if (error || !engagement) {
    return NextResponse.json({ error: "Engagement not found" }, { status: 404 });
  }

  if (!engagement.total_fee_amount) {
    return NextResponse.json(
      { error: "Set a numeric total fee on this engagement before creating an invoice" },
      { status: 400 },
    );
  }

  const company = Array.isArray(engagement.companies) ? engagement.companies[0] : engagement.companies;
  if (!company) {
    return NextResponse.json({ error: "Company not found for this engagement" }, { status: 404 });
  }

  const client = Array.isArray(engagement.clients) ? engagement.clients[0] : engagement.clients;
  if (!client?.email) {
    return NextResponse.json(
      { error: "This engagement's client has no email on file — required for QuickBooks to generate a pay link" },
      { status: 400 },
    );
  }

  try {
    let customerId = company.qb_customer_id;
    if (!customerId) {
      customerId = await findOrCreateCustomer(company.name, client.email);
      await supabase.from("companies").update({ qb_customer_id: customerId }).eq("id", company.id);
    }

    const invoice = await createInvoice({
      customerId,
      amount: engagement.total_fee_amount,
      description: engagement.engagement_title,
      billEmail: client.email,
    });

    await supabase
      .from("engagements")
      .update({
        qb_invoice_id: invoice.invoiceId,
        qb_invoice_link: invoice.invoiceLink,
        invoice_sent_at: new Date().toISOString(),
      })
      .eq("id", engagementId);

    return NextResponse.json({ success: true, invoiceLink: invoice.invoiceLink });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to create QuickBooks invoice",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
