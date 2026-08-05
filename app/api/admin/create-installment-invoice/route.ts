import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireAdmin } from "@/lib/supabase/server";
import { findOrCreateCustomer, createInvoice } from "@/lib/quickbooks";

// Staff-triggered project installment invoicing -- mirrors
// quickbooks/create-invoice/route.ts exactly, but reads/writes one
// engagement_invoice_installments row instead of the engagement itself
// (an engagement can have several installments, each with its own invoice).
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const body = await req.json();
  const { installmentId } = body;
  if (!installmentId) {
    return NextResponse.json({ error: "installmentId is required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: installment, error } = await supabase
    .from("engagement_invoice_installments")
    .select(
      "id, trigger_label, amount, status, engagements(id, engagement_title, company_id, companies(id, name, qb_customer_id), clients(email))",
    )
    .eq("id", installmentId)
    .single();

  if (error || !installment) {
    return NextResponse.json({ error: "Installment not found" }, { status: 404 });
  }

  if (installment.status !== "pending") {
    return NextResponse.json({ error: "This installment already has an invoice" }, { status: 400 });
  }

  const engagement = Array.isArray(installment.engagements) ? installment.engagements[0] : installment.engagements;
  if (!engagement) {
    return NextResponse.json({ error: "Engagement not found for this installment" }, { status: 404 });
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
      amount: installment.amount,
      description: `${engagement.engagement_title} — ${installment.trigger_label}`,
      billEmail: client.email,
    });

    await supabase
      .from("engagement_invoice_installments")
      .update({
        status: "invoiced",
        qb_invoice_id: invoice.invoiceId,
        qb_invoice_link: invoice.invoiceLink,
        invoice_sent_at: new Date().toISOString(),
      })
      .eq("id", installmentId);

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
