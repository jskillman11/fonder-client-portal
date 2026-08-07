import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireAdmin } from "@/lib/supabase/server";
import { findOrCreateCustomer, createInvoice } from "@/lib/quickbooks";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const body = await req.json();
  const { companyId } = body;
  if (!companyId) {
    return NextResponse.json({ error: "companyId is required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: company, error } = await supabase
    .from("companies")
    .select("id, name, engagement_title, total_fee_amount, qb_customer_id, clients:client_id(email)")
    .eq("id", companyId)
    .single();

  if (error || !company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  if (!company.total_fee_amount) {
    return NextResponse.json(
      { error: "Set a numeric total fee on this company's engagement before creating an invoice" },
      { status: 400 },
    );
  }

  const client = Array.isArray(company.clients) ? company.clients[0] : company.clients;
  if (!client?.email) {
    return NextResponse.json(
      { error: "This company's client has no email on file — required for QuickBooks to generate a pay link" },
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
      amount: company.total_fee_amount,
      description: company.engagement_title ?? company.name,
      billEmail: client.email,
    });

    await supabase
      .from("companies")
      .update({
        qb_invoice_id: invoice.invoiceId,
        qb_invoice_link: invoice.invoiceLink,
        invoice_sent_at: new Date().toISOString(),
      })
      .eq("id", companyId);

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
