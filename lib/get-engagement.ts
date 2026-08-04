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
  documentStoragePath: string | null;
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

export type EngagementStatus = "active" | "completed";

export type EngagementRecord = {
  id: string;
  companyId: string;
  companyName: string;
  clientId: string | null;
  engagementTitle: string;
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
};

export async function listEngagementsForCompany(companyId: string): Promise<
  { id: string; engagementTitle: string; status: EngagementStatus }[]
> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("engagements")
    .select("id, engagement_title, status")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    engagementTitle: row.engagement_title,
    status: row.status as EngagementStatus,
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
      "id, name, logo_storage_path, sow_document_id, msa_document_id, lock_portal_tabs, shared_drive_url, tab_lock_overrides, sow_signed_at, msa_signed_at, kickoff_booked_at, kickoff_start_time, sow_doc:sow_document_id(content_markdown), msa_doc:msa_document_id(content_markdown)",
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
    documentStoragePath: engagement.document_storage_path,
    clientLogoUrl,
    sowContentMarkdown: sowDoc?.content_markdown ?? null,
    msaContentMarkdown: msaDoc?.content_markdown ?? null,
    sowSigned: Boolean(company.sow_signed_at),
    msaSigned: Boolean(company.msa_signed_at),
    kickoffBooked: Boolean(company.kickoff_booked_at),
    kickoffStartTime: company.kickoff_start_time,
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

// Admin-facing lookup, keyed by the engagement's own id -- a lean record,
// since documents/team/shared-drive/portal-locks no longer live here.
export async function getEngagementById(
  engagementId: string,
): Promise<EngagementRecord | null> {
  const supabase = createServiceClient();
  const { data: engagement, error } = await supabase
    .from("engagements")
    .select("*, companies(id, name)")
    .eq("id", engagementId)
    .single();

  if (error || !engagement) return null;
  const company = Array.isArray(engagement.companies)
    ? engagement.companies[0]
    : engagement.companies;

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
    engagementTitle: engagement.engagement_title,
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
  };
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
