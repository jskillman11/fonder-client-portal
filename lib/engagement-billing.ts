import { createServiceClient } from "./supabase/server";
import { findOrCreateCustomer, createInvoice } from "./quickbooks";

export type ProjectPaymentTerms = "50_25_25" | "50_40_10";
export type PaymentTerms = ProjectPaymentTerms | "monthly_in_advance";

export const INSTALLMENT_PLANS: Record<ProjectPaymentTerms, { label: string; percentage: number }[]> = {
  "50_25_25": [
    { label: "Upfront", percentage: 50 },
    { label: "Milestone reached", percentage: 25 },
    { label: "Final delivery", percentage: 25 },
  ],
  "50_40_10": [
    { label: "Upfront", percentage: 50 },
    { label: "Midpoint", percentage: 40 },
    { label: "Final delivery", percentage: 10 },
  ],
};

export type InstallmentStatus = "pending" | "invoiced" | "paid";

export type InstallmentRow = {
  id: string;
  sequence: number;
  triggerLabel: string;
  percentage: number;
  amount: number;
  status: InstallmentStatus;
  qbInvoiceId: string | null;
  qbInvoiceLink: string | null;
  invoiceSentAt: string | null;
  invoicePaidAt: string | null;
};

export type BillingCycleRow = {
  id: string;
  periodLabel: string;
  periodStart: string;
  amount: number;
  status: InstallmentStatus;
  qbInvoiceId: string | null;
  qbInvoiceLink: string | null;
  invoiceSentAt: string | null;
  invoicePaidAt: string | null;
};

// Regenerates the PENDING installment plan for a project engagement from its
// payment_terms + budget -- called after create/update whenever either
// changes. Rows already invoiced/paid are left alone (they represent a real
// QuickBooks invoice that already exists and shouldn't be silently deleted
// out from under it).
export async function createInstallmentsForEngagement(
  engagementId: string,
  paymentTerms: string | null,
  budgetAmount: number | null,
): Promise<void> {
  const supabase = createServiceClient();

  await supabase
    .from("engagement_invoice_installments")
    .delete()
    .eq("engagement_id", engagementId)
    .eq("status", "pending");

  const plan = paymentTerms && paymentTerms in INSTALLMENT_PLANS ? INSTALLMENT_PLANS[paymentTerms as ProjectPaymentTerms] : null;
  if (!plan || !budgetAmount) return;

  const rows = plan.map((step, i) => ({
    engagement_id: engagementId,
    sequence: i,
    trigger_label: step.label,
    percentage: step.percentage,
    amount: Math.round(((budgetAmount * step.percentage) / 100) * 100) / 100,
  }));

  await supabase.from("engagement_invoice_installments").insert(rows);
}

export async function listInstallments(engagementId: string): Promise<InstallmentRow[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("engagement_invoice_installments")
    .select("*")
    .eq("engagement_id", engagementId)
    .order("sequence", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    sequence: row.sequence,
    triggerLabel: row.trigger_label,
    percentage: Number(row.percentage),
    amount: Number(row.amount),
    status: row.status as InstallmentStatus,
    qbInvoiceId: row.qb_invoice_id,
    qbInvoiceLink: row.qb_invoice_link,
    invoiceSentAt: row.invoice_sent_at,
    invoicePaidAt: row.invoice_paid_at,
  }));
}

export async function listBillingCycles(engagementId: string): Promise<BillingCycleRow[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("engagement_billing_cycles")
    .select("*")
    .eq("engagement_id", engagementId)
    .order("period_start", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    periodLabel: row.period_label,
    periodStart: row.period_start,
    amount: Number(row.amount),
    status: row.status as InstallmentStatus,
    qbInvoiceId: row.qb_invoice_id,
    qbInvoiceLink: row.qb_invoice_link,
    invoiceSentAt: row.invoice_sent_at,
    invoicePaidAt: row.invoice_paid_at,
  }));
}

// Feeds the cron job (app/api/cron/partnership-invoices) -- every currently
// active partnership engagement, with just the fields ensureCurrentBillingCycle
// needs to create this month's draft invoice.
export async function listActivePartnershipEngagements(): Promise<PartnershipEngagementForBilling[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("engagements")
    .select(
      "id, company_id, total_fee_amount, duration_months, companies(name, qb_customer_id), clients(email)",
    )
    .eq("status", "active")
    .eq("engagement_type", "partnership");

  return (data ?? []).map((row) => {
    const company = Array.isArray(row.companies) ? row.companies[0] : row.companies;
    const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
    return {
      id: row.id,
      companyId: row.company_id,
      companyName: company?.name ?? "",
      qbCustomerId: company?.qb_customer_id ?? null,
      totalFeeAmount: row.total_fee_amount,
      durationMonths: row.duration_months,
      clientEmail: client?.email ?? null,
    };
  });
}

export type PartnershipEngagementForBilling = {
  id: string;
  companyId: string;
  companyName: string;
  qbCustomerId: string | null;
  totalFeeAmount: number | null;
  durationMonths: number | null;
  clientEmail: string | null;
};

// Creates this month's draft invoice for one partnership engagement, if one
// doesn't already exist -- the only place a billing cycle is ever created.
// Safe to call any number of times for the same engagement in the same
// month: the (engagement_id, period_start) unique index makes this a no-op
// on every call after the first.
export async function ensureCurrentBillingCycle(
  engagement: PartnershipEngagementForBilling,
): Promise<{ created: boolean; reason?: string }> {
  if (!engagement.totalFeeAmount || !engagement.durationMonths) {
    return { created: false, reason: "Missing budget or duration" };
  }
  if (!engagement.clientEmail) {
    return { created: false, reason: "No client email on file" };
  }

  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const periodLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(now);

  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("engagement_billing_cycles")
    .select("id")
    .eq("engagement_id", engagement.id)
    .eq("period_start", periodStart)
    .maybeSingle();

  if (existing) {
    return { created: false, reason: "Cycle already created for this period" };
  }

  let customerId = engagement.qbCustomerId;
  if (!customerId) {
    customerId = await findOrCreateCustomer(engagement.companyName, engagement.clientEmail);
    await supabase.from("companies").update({ qb_customer_id: customerId }).eq("id", engagement.companyId);
  }

  const amount = Math.round((engagement.totalFeeAmount / engagement.durationMonths) * 100) / 100;
  const invoice = await createInvoice({
    customerId,
    amount,
    description: `${engagement.companyName} — ${periodLabel}`,
    billEmail: engagement.clientEmail,
  });

  await supabase.from("engagement_billing_cycles").insert({
    engagement_id: engagement.id,
    period_label: periodLabel,
    period_start: periodStart,
    amount,
    status: "invoiced",
    qb_invoice_id: invoice.invoiceId,
    qb_invoice_link: invoice.invoiceLink,
    invoice_sent_at: now.toISOString(),
  });

  return { created: true };
}
