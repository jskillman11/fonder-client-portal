import { createServiceClient } from "./supabase/server";
import type { TabLockState } from "./portal-app-tabs";

export type TeamMember = {
  name: string;
  role: string;
  blurb?: string;
  iconBgColor?: string | null;
  iconTextColor?: string | null;
};

export type Milestone = { label: string; date: string };

export type EngagementData = {
  id: string;
  clientSlug: string;
  clientName: string;
  engagementTitle: string;
  totalFee: string;
  finalDeliveryDate: string;
  team: TeamMember[];
  companyId: string | null;
  clientId: string | null;
  sowDocumentId: string | null;
  msaDocumentId: string | null;
  clientSignatoryName: string;
  clientSignatoryFirstName: string;
  clientSignatoryLastName: string;
  clientSignatoryEmail: string;
  fonderSignatoryName: string;
  fonderSignatoryEmail: string;
  clientLogoUrl: string | null;
  sowContentMarkdown: string | null;
  msaContentMarkdown: string | null;
  sowSigned: boolean;
  msaSigned: boolean;
  kickoffBooked: boolean;
  kickoffStartTime: string | null;
  kickoffEarliestDate: string | null;
  scopeSummary: string | null;
  milestones: Milestone[];
  lockPortalTabs: boolean;
  sharedDriveUrl: string | null;
  tabLockOverrides: Record<string, TabLockState>;
  qbInvoiceLink: string | null;
  invoicePaid: boolean;
};

// A missing SOW or MSA trivially satisfies its own half of this check (a
// company using only one of the two shouldn't be blocked on the other), but
// that must not extend to having neither -- with nothing to sign, both
// halves would trivially pass. hasAnyDoc guards against that. Shared by
// app/portal/[client]/app/layout.tsx (the global tab-unlock gate) and
// app/portal/[client]/app/home/page.tsx (the onboarding checklist itself) --
// previously copy-pasted between the two.
export function computeDocsSigned(engagement: {
  sowContentMarkdown: string | null;
  msaContentMarkdown: string | null;
  sowSigned: boolean;
  msaSigned: boolean;
}): boolean {
  const hasAnyDoc = Boolean(engagement.sowContentMarkdown) || Boolean(engagement.msaContentMarkdown);
  return (
    hasAnyDoc &&
    (!engagement.sowContentMarkdown || engagement.sowSigned) &&
    (!engagement.msaContentMarkdown || engagement.msaSigned)
  );
}

export type EngagementStatus = "active" | "completed";

export type EngagementType = "project" | "partnership";
export type PartnershipTier = "growth" | "venture";
export type PaymentTerms = "50_25_25" | "50_40_10" | "monthly_in_advance";

export type EngagementRecord = {
  id: string;
  companyId: string;
  companyName: string;
  clientId: string | null;
  clientEmail: string | null;
  engagementTitle: string;
  engagementType: EngagementType;
  partnershipTier: PartnershipTier | null;
  paymentTerms: PaymentTerms | null;
  durationMonths: number | null;
  totalFee: string;
  totalFeeAmount: number | null;
  finalDeliveryDate: string;
  kickoffEarliestDate: string | null;
  scopeSummary: string | null;
  status: EngagementStatus;
  milestones: Milestone[];
  qbInvoiceId: string | null;
  qbInvoiceLink: string | null;
  invoiceSentAt: string | null;
  invoicePaidAt: string | null;
  qbCustomerId: string | null;
};

export type CompanyEngagementRow = {
  id: string;
  engagementTitle: string;
  status: EngagementStatus;
  totalFee: string;
  qbInvoiceId: string | null;
  qbInvoiceLink: string | null;
  invoiceSentAt: string | null;
  invoicePaidAt: string | null;
};

export async function listEngagementsForCompany(companyId: string): Promise<CompanyEngagementRow[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("engagements")
    .select(
      "id, engagement_title, status, total_fee, qb_invoice_id, qb_invoice_link, invoice_sent_at, invoice_paid_at",
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    engagementTitle: row.engagement_title,
    status: row.status as EngagementStatus,
    totalFee: row.total_fee,
    qbInvoiceId: row.qb_invoice_id,
    qbInvoiceLink: row.qb_invoice_link,
    invoiceSentAt: row.invoice_sent_at,
    invoicePaidAt: row.invoice_paid_at,
  }));
}

// Portal-facing lookup, keyed by the company's (stable) portal slug --
// resolves the company, then its currently active engagement, and merges
// company-level settings (docs in force, shared drive, portal locks, team)
// into the same EngagementData shape every portal page already expects, so
// none of those pages need to change.
export async function getEngagement(
  clientSlug: string,
): Promise<EngagementData | null> {
  const supabase = createServiceClient();

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select(
      "id, name, logo_storage_path, sow_document_id, msa_document_id, lock_portal_tabs, shared_drive_url, tab_lock_overrides, sow_doc:sow_document_id(content_markdown), msa_doc:msa_document_id(content_markdown)",
    )
    .eq("client_slug", clientSlug)
    .single();

  if (companyError || !company) return null;

  const { data: engagement } = await supabase
    .from("engagements")
    .select("*, clients(id, first_name, last_name, email)")
    .eq("company_id", company.id)
    .eq("status", "active")
    .maybeSingle();

  if (!engagement) return null;

  const client = Array.isArray(engagement.clients)
    ? engagement.clients[0]
    : engagement.clients;
  const sowDoc = Array.isArray(company.sow_doc) ? company.sow_doc[0] : company.sow_doc;
  const msaDoc = Array.isArray(company.msa_doc) ? company.msa_doc[0] : company.msa_doc;

  const { data: teamRows } = await supabase
    .from("company_team_assignments")
    .select("sort_order, team_members(name, role, icon_bg_color, icon_text_color)")
    .eq("company_id", company.id)
    .order("sort_order", { ascending: true });

  const { data: milestoneRows } = await supabase
    .from("engagement_milestones")
    .select("label, milestone_date")
    .eq("engagement_id", engagement.id)
    .order("milestone_date", { ascending: true });

  let clientLogoUrl: string | null = null;
  if (company.logo_storage_path) {
    const { data } = supabase.storage
      .from("engagement-logos")
      .getPublicUrl(company.logo_storage_path);
    clientLogoUrl = data.publicUrl;
  }

  const firstName = client?.first_name ?? "";
  const lastName = client?.last_name ?? "";

  return {
    id: engagement.id,
    clientSlug,
    clientName: company.name,
    engagementTitle: engagement.engagement_title,
    totalFee: engagement.total_fee,
    finalDeliveryDate: engagement.final_delivery_date,
    companyId: company.id,
    clientId: engagement.client_id,
    sowDocumentId: company.sow_document_id,
    msaDocumentId: company.msa_document_id,
    clientSignatoryName: `${firstName} ${lastName}`.trim(),
    clientSignatoryFirstName: firstName,
    clientSignatoryLastName: lastName,
    clientSignatoryEmail: client?.email ?? "",
    fonderSignatoryName: engagement.fonder_signatory_name,
    fonderSignatoryEmail: engagement.fonder_signatory_email,
    clientLogoUrl,
    sowContentMarkdown: sowDoc?.content_markdown ?? null,
    msaContentMarkdown: msaDoc?.content_markdown ?? null,
    sowSigned: Boolean(engagement.sow_signed_at),
    msaSigned: Boolean(engagement.msa_signed_at),
    kickoffBooked: Boolean(engagement.kickoff_booked_at),
    kickoffStartTime: engagement.kickoff_start_time,
    kickoffEarliestDate: engagement.kickoff_earliest_date,
    scopeSummary: engagement.scope_summary,
    lockPortalTabs: company.lock_portal_tabs,
    sharedDriveUrl: company.shared_drive_url,
    tabLockOverrides: company.tab_lock_overrides ?? {},
    qbInvoiceLink: engagement.qb_invoice_link,
    invoicePaid: Boolean(engagement.invoice_paid_at),
    milestones: (milestoneRows ?? []).map((m) => ({
      label: m.label,
      date: m.milestone_date,
    })),
    team: (teamRows ?? [])
      .map((row) => {
        const tm = Array.isArray(row.team_members) ? row.team_members[0] : row.team_members;
        if (!tm) return null;
        return {
          name: tm.name,
          role: tm.role,
          iconBgColor: tm.icon_bg_color,
          iconTextColor: tm.icon_text_color,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null),
  };
}

export type EngagementHistoryItem = {
  id: string;
  engagementTitle: string;
  status: EngagementStatus;
  totalFee: string;
  sowSigned: boolean;
  msaSigned: boolean;
  sowDocumentPath: string | null;
  msaDocumentPath: string | null;
  qbInvoiceLink: string | null;
  invoicePaid: boolean;
};

// Portal-facing lookup across a company's FULL engagement history, not just
// the one currently-active engagement getEngagement() resolves -- feeds the
// Documents and Invoices tabs, so a client can still reach a prior,
// completed engagement's signed contract or invoice.
export async function getCompanyEngagementHistory(clientSlug: string): Promise<{
  companyName: string;
  clientLogoUrl: string | null;
  engagements: EngagementHistoryItem[];
} | null> {
  const supabase = createServiceClient();

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name, logo_storage_path")
    .eq("client_slug", clientSlug)
    .single();

  if (companyError || !company) return null;

  const { data: engagementRows } = await supabase
    .from("engagements")
    .select(
      "id, engagement_title, status, total_fee, sow_signed_at, msa_signed_at, sow_signed_document_path, msa_signed_document_path, qb_invoice_link, invoice_paid_at",
    )
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  let clientLogoUrl: string | null = null;
  if (company.logo_storage_path) {
    const { data } = supabase.storage
      .from("engagement-logos")
      .getPublicUrl(company.logo_storage_path);
    clientLogoUrl = data.publicUrl;
  }

  return {
    companyName: company.name,
    clientLogoUrl,
    engagements: (engagementRows ?? []).map((e) => ({
      id: e.id,
      engagementTitle: e.engagement_title,
      status: e.status as EngagementStatus,
      totalFee: e.total_fee,
      sowSigned: Boolean(e.sow_signed_at),
      msaSigned: Boolean(e.msa_signed_at),
      sowDocumentPath: e.sow_signed_document_path,
      msaDocumentPath: e.msa_signed_document_path,
      qbInvoiceLink: e.qb_invoice_link,
      invoicePaid: Boolean(e.invoice_paid_at),
    })),
  };
}

// Admin-facing lookup, keyed by the engagement's own id -- a lean record,
// since documents/team/shared-drive/portal-locks no longer live here.
export async function getEngagementById(
  engagementId: string,
): Promise<EngagementRecord | null> {
  const supabase = createServiceClient();
  const { data: engagement, error } = await supabase
    .from("engagements")
    .select("*, companies(id, name, qb_customer_id), clients(email)")
    .eq("id", engagementId)
    .single();

  if (error || !engagement) return null;
  const company = Array.isArray(engagement.companies)
    ? engagement.companies[0]
    : engagement.companies;
  const client = Array.isArray(engagement.clients) ? engagement.clients[0] : engagement.clients;

  const { data: milestoneRows } = await supabase
    .from("engagement_milestones")
    .select("label, milestone_date")
    .eq("engagement_id", engagementId)
    .order("milestone_date", { ascending: true });

  return {
    id: engagement.id,
    companyId: engagement.company_id,
    companyName: company?.name ?? "",
    clientId: engagement.client_id,
    clientEmail: client?.email ?? null,
    engagementTitle: engagement.engagement_title,
    engagementType: engagement.engagement_type as EngagementType,
    partnershipTier: engagement.partnership_tier,
    paymentTerms: engagement.payment_terms,
    durationMonths: engagement.duration_months,
    totalFee: engagement.total_fee,
    totalFeeAmount: engagement.total_fee_amount,
    finalDeliveryDate: engagement.final_delivery_date,
    kickoffEarliestDate: engagement.kickoff_earliest_date,
    scopeSummary: engagement.scope_summary,
    status: engagement.status as EngagementStatus,
    milestones: (milestoneRows ?? []).map((m) => ({
      label: m.label,
      date: m.milestone_date,
    })),
    qbInvoiceId: engagement.qb_invoice_id,
    qbInvoiceLink: engagement.qb_invoice_link,
    invoiceSentAt: engagement.invoice_sent_at,
    invoicePaidAt: engagement.invoice_paid_at,
    qbCustomerId: company?.qb_customer_id ?? null,
  };
}

// Admin-facing lookup for the company Overview tab -- the current
// engagement's full record (if the company has one active), reusing the
// exact same shape as getEngagementById so the Overview tab's form can share
// EngagementOverviewForm with the (now-removed) standalone engagement page.
export async function getActiveEngagementForCompany(companyId: string): Promise<EngagementRecord | null> {
  const supabase = createServiceClient();
  const { data: row } = await supabase
    .from("engagements")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "active")
    .maybeSingle();

  if (!row) return null;
  return getEngagementById(row.id);
}

export type EngagementSummary = {
  id: string;
  companyId: string;
  companyName: string;
  engagementTitle: string;
  status: EngagementStatus;
  sowSigned: boolean;
  msaSigned: boolean;
  qbInvoiceId: string | null;
  invoicePaidAt: string | null;
  createdAt: string;
};

// Cross-company lookup for the admin Home dashboard -- everything else in
// this file is scoped to one company/engagement. "Signed" here just checks
// sow_signed_at/msa_signed_at directly rather than reproducing
// computeDocsSigned's per-company hasAnyDoc nuance (that needs each
// company's configured sow/msa document, a join this overview doesn't
// otherwise need), so an engagement with no SOW/MSA configured at all reads
// as "pending" here -- acceptable for a summary count, not exact per-company.
export async function listAllEngagements(): Promise<EngagementSummary[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("engagements")
    .select(
      "id, company_id, engagement_title, status, sow_signed_at, msa_signed_at, qb_invoice_id, invoice_paid_at, created_at, companies(name)",
    )
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => {
    const company = Array.isArray(row.companies) ? row.companies[0] : row.companies;
    return {
      id: row.id,
      companyId: row.company_id,
      companyName: company?.name ?? "",
      engagementTitle: row.engagement_title,
      status: row.status as EngagementStatus,
      sowSigned: Boolean(row.sow_signed_at),
      msaSigned: Boolean(row.msa_signed_at),
      qbInvoiceId: row.qb_invoice_id,
      invoicePaidAt: row.invoice_paid_at,
      createdAt: row.created_at,
    };
  });
}

// Downloads the actual PDF bytes from Supabase Storage for a given engagement.
export async function getEngagementPdfBytes(
  documentStoragePath: string,
): Promise<Buffer> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from("engagement-documents")
    .download(documentStoragePath);

  if (error || !data) {
    throw new Error(`Failed to download document: ${error?.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
