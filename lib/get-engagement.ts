import { createServiceClient } from "./supabase/server";
import type { TabLockState } from "./portal-app-tabs";

export type TeamMember = {
  name: string;
  role: string;
  blurb?: string;
  avatarUrl?: string | null;
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
  sowDocumentPath: string | null;
  msaDocumentPath: string | null;
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

export type EngagementType = "project" | "partnership";
export type PartnershipTier = "growth" | "venture";
export type PaymentTerms = "50_25_25" | "50_40_10" | "monthly_in_advance";

// Portal-facing lookup, keyed by the company's (stable) portal slug -- a
// company always has a portal once it exists (client_slug is set at
// creation, see lib/companies-clients.ts's createCompany), regardless of
// whether staff have filled in engagement details yet. Fields below default
// to empty/false until then, rather than this returning null.
export async function getEngagement(clientSlug: string): Promise<EngagementData | null> {
  const supabase = createServiceClient();

  const { data: company, error } = await supabase
    .from("companies")
    .select(
      `id, name, logo_storage_path, sow_document_id, msa_document_id, lock_portal_tabs,
       shared_drive_url, tab_lock_overrides, client_id, engagement_title, total_fee,
       final_delivery_date, fonder_signatory_name, fonder_signatory_email, sow_signed_at,
       msa_signed_at, sow_signed_document_path, msa_signed_document_path, kickoff_booked_at,
       kickoff_start_time, kickoff_earliest_date, scope_summary, qb_invoice_link, invoice_paid_at,
       sow_doc:sow_document_id(content_markdown), msa_doc:msa_document_id(content_markdown),
       clients:client_id(id, first_name, last_name, email)`,
    )
    .eq("client_slug", clientSlug)
    .single();

  if (error || !company) return null;

  const client = Array.isArray(company.clients) ? company.clients[0] : company.clients;
  const sowDoc = Array.isArray(company.sow_doc) ? company.sow_doc[0] : company.sow_doc;
  const msaDoc = Array.isArray(company.msa_doc) ? company.msa_doc[0] : company.msa_doc;

  const { data: teamRows } = await supabase
    .from("company_team_assignments")
    .select(
      "sort_order, team_members(name, role, icon_bg_color, icon_text_color, profiles!staff_id(full_name, job_title, avatar_storage_path, icon_bg_color, icon_text_color))",
    )
    .eq("company_id", company.id)
    .order("sort_order", { ascending: true });

  const { data: milestoneRows } = await supabase
    .from("company_milestones")
    .select("label, milestone_date")
    .eq("company_id", company.id)
    .order("milestone_date", { ascending: true });

  let clientLogoUrl: string | null = null;
  if (company.logo_storage_path) {
    const { data } = supabase.storage.from("engagement-logos").getPublicUrl(company.logo_storage_path);
    clientLogoUrl = data.publicUrl;
  }

  const firstName = client?.first_name ?? "";
  const lastName = client?.last_name ?? "";

  return {
    id: company.id,
    clientSlug,
    clientName: company.name,
    engagementTitle: company.engagement_title ?? "",
    totalFee: company.total_fee ?? "",
    finalDeliveryDate: company.final_delivery_date ?? "",
    companyId: company.id,
    clientId: company.client_id,
    sowDocumentId: company.sow_document_id,
    msaDocumentId: company.msa_document_id,
    clientSignatoryName: `${firstName} ${lastName}`.trim(),
    clientSignatoryFirstName: firstName,
    clientSignatoryLastName: lastName,
    clientSignatoryEmail: client?.email ?? "",
    fonderSignatoryName: company.fonder_signatory_name,
    fonderSignatoryEmail: company.fonder_signatory_email,
    clientLogoUrl,
    sowContentMarkdown: sowDoc?.content_markdown ?? null,
    msaContentMarkdown: msaDoc?.content_markdown ?? null,
    sowSigned: Boolean(company.sow_signed_at),
    msaSigned: Boolean(company.msa_signed_at),
    sowDocumentPath: company.sow_signed_document_path,
    msaDocumentPath: company.msa_signed_document_path,
    kickoffBooked: Boolean(company.kickoff_booked_at),
    kickoffStartTime: company.kickoff_start_time,
    kickoffEarliestDate: company.kickoff_earliest_date,
    scopeSummary: company.scope_summary,
    lockPortalTabs: company.lock_portal_tabs,
    sharedDriveUrl: company.shared_drive_url,
    tabLockOverrides: company.tab_lock_overrides ?? {},
    qbInvoiceLink: company.qb_invoice_link,
    invoicePaid: Boolean(company.invoice_paid_at),
    milestones: (milestoneRows ?? []).map((m) => ({ label: m.label, date: m.milestone_date })),
    team: (teamRows ?? [])
      .map((row) => {
        const tm = Array.isArray(row.team_members) ? row.team_members[0] : row.team_members;
        if (!tm) return null;
        // Mirrors lib/team-members.ts's mapTeamMemberRow -- a linked roster
        // entry's name/role/icon/photo come from its staff profile, not the
        // team_members row's own (possibly stale) columns.
        const profile = Array.isArray(tm.profiles) ? tm.profiles[0] : tm.profiles;
        return {
          name: profile?.full_name || tm.name,
          role: profile?.job_title || tm.role,
          avatarUrl: profile?.avatar_storage_path
            ? supabase.storage.from("engagement-logos").getPublicUrl(profile.avatar_storage_path).data.publicUrl
            : null,
          iconBgColor: profile?.icon_bg_color ?? tm.icon_bg_color,
          iconTextColor: profile?.icon_text_color ?? tm.icon_text_color,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null),
  };
}

export type CompanyEngagementRecord = {
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
  milestones: Milestone[];
  qbInvoiceId: string | null;
  qbInvoiceLink: string | null;
  invoiceSentAt: string | null;
  invoicePaidAt: string | null;
  qbCustomerId: string | null;
};

// Admin-facing lookup for the company Overview tab -- always returns a
// record (a company's engagement fields are just empty/null until staff
// fill them in), so the Overview form has nothing conditional to branch on.
export async function getCompanyEngagement(companyId: string): Promise<CompanyEngagementRecord | null> {
  const supabase = createServiceClient();
  const { data: company, error } = await supabase
    .from("companies")
    .select(
      `id, name, qb_customer_id, client_id, engagement_title, engagement_type, partnership_tier,
       payment_terms, duration_months, total_fee, total_fee_amount, final_delivery_date,
       kickoff_earliest_date, scope_summary, qb_invoice_id, qb_invoice_link, invoice_sent_at,
       invoice_paid_at, clients:client_id(email)`,
    )
    .eq("id", companyId)
    .single();

  if (error || !company) return null;
  const client = Array.isArray(company.clients) ? company.clients[0] : company.clients;

  const { data: milestoneRows } = await supabase
    .from("company_milestones")
    .select("label, milestone_date")
    .eq("company_id", companyId)
    .order("milestone_date", { ascending: true });

  return {
    companyId: company.id,
    companyName: company.name,
    clientId: company.client_id,
    clientEmail: client?.email ?? null,
    engagementTitle: company.engagement_title ?? "",
    engagementType: company.engagement_type as EngagementType,
    partnershipTier: company.partnership_tier,
    paymentTerms: company.payment_terms,
    durationMonths: company.duration_months,
    totalFee: company.total_fee ?? "",
    totalFeeAmount: company.total_fee_amount,
    finalDeliveryDate: company.final_delivery_date ?? "",
    kickoffEarliestDate: company.kickoff_earliest_date,
    scopeSummary: company.scope_summary,
    milestones: (milestoneRows ?? []).map((m) => ({ label: m.label, date: m.milestone_date })),
    qbInvoiceId: company.qb_invoice_id,
    qbInvoiceLink: company.qb_invoice_link,
    invoiceSentAt: company.invoice_sent_at,
    invoicePaidAt: company.invoice_paid_at,
    qbCustomerId: company.qb_customer_id,
  };
}

export type CompanyEngagementSummary = {
  companyId: string;
  companyName: string;
  engagementTitle: string;
  sowSigned: boolean;
  msaSigned: boolean;
  qbInvoiceId: string | null;
  invoicePaidAt: string | null;
};

// Cross-company lookup for the admin Home dashboard. "Signed" here just
// checks sow_signed_at/msa_signed_at directly rather than reproducing
// computeDocsSigned's per-company hasAnyDoc nuance (that needs each
// company's configured sow/msa document, a join this overview doesn't
// otherwise need), so a company with no SOW/MSA configured at all reads as
// "pending" here -- acceptable for a summary count, not exact per-company.
export async function listAllCompanyEngagements(): Promise<CompanyEngagementSummary[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("companies")
    .select("id, name, engagement_title, sow_signed_at, msa_signed_at, qb_invoice_id, invoice_paid_at")
    .order("name", { ascending: true });

  return (data ?? []).map((row) => ({
    companyId: row.id,
    companyName: row.name,
    engagementTitle: row.engagement_title ?? "",
    sowSigned: Boolean(row.sow_signed_at),
    msaSigned: Boolean(row.msa_signed_at),
    qbInvoiceId: row.qb_invoice_id,
    invoicePaidAt: row.invoice_paid_at,
  }));
}

// Downloads the actual PDF bytes from Supabase Storage for a given document.
export async function getEngagementPdfBytes(documentStoragePath: string): Promise<Buffer> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage.from("engagement-documents").download(documentStoragePath);

  if (error || !data) {
    throw new Error(`Failed to download document: ${error?.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
