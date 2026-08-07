import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireAdmin } from "@/lib/supabase/server";
import { findOrCreateCustomer, createInvoice } from "@/lib/quickbooks";

// Staff-triggered project installment invoicing -- mirrors
// quickbooks/create-invoice/route.ts exactly, but reads/writes one
// company_invoice_installments row instead of the company itself (a company
// can have several installments, each with its own invoice).
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
    .from("company_invoice_installments")
    .select(
      "id, trigger_label, amount, status, companies:company_id(id, name, engagement_title, qb_customer_id, clients:client_id(email))",
    )
    .eq("id", installmentId)
    .single();

  if (error || !installment) {
    return NextResponse.json({ error: "Installment not found" }, { status: 404 });
  }

  if (installment.status !== "pending") {
    return NextResponse.json({ error: "This installment already has an invoice" }, { status: 400 });
  }

  const company = Array.isArray(installment.companies) ? installment.companies[0] : installment.companies;
  if (!company) {
    return NextResponse.json({ error: "Company not found for this installment" }, { status: 404 });
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
      amount: installment.amount,
      description: `${company.engagement_title ?? company.name} — ${installment.trigger_label}`,
      billEmail: client.email,
    });

    await supabase
      .from("company_invoice_installments")
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
