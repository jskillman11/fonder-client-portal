import { createServiceClient } from "./supabase/server";

export type TeamMember = {
  name: string;
  role: string;
  blurb?: string;
  iconBgColor?: string | null;
  iconTextColor?: string | null;
};

export type EngagementData = {
  clientSlug: string;
  clientName: string;
  engagementTitle: string;
  totalFee: string;
  finalDeliveryDate: string;
  team: TeamMember[];
  companyId: string | null;
  clientId: string | null;
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
};

export async function listEngagements(): Promise<
  { clientSlug: string; clientName: string; engagementTitle: string }[]
> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("engagements")
    .select("client_slug, engagement_title, companies(name)")
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    clientSlug: row.client_slug,
    // Supabase returns joined relations as an array or object depending on
    // the relationship shape -- normalize defensively either way.
    clientName: Array.isArray(row.companies)
      ? (row.companies[0]?.name ?? "Unknown")
      : ((row.companies as { name: string } | null)?.name ?? "Unknown"),
    engagementTitle: row.engagement_title,
  }));
}

export async function getEngagement(
  clientSlug: string,
): Promise<EngagementData | null> {
  const supabase = createServiceClient();

  const { data: engagement, error } = await supabase
    .from("engagements")
    .select("*, companies(id, name, logo_storage_path), clients(id, first_name, last_name, email)")
    .eq("client_slug", clientSlug)
    .single();

  if (error || !engagement) return null;

  const company = Array.isArray(engagement.companies)
    ? engagement.companies[0]
    : engagement.companies;
  const client = Array.isArray(engagement.clients)
    ? engagement.clients[0]
    : engagement.clients;

  const { data: teamRows } = await supabase
    .from("engagement_team_members")
    .select("name, role, blurb, icon_bg_color, icon_text_color")
    .eq("engagement_id", engagement.id)
    .order("sort_order", { ascending: true });

  let clientLogoUrl: string | null = null;
  if (company?.logo_storage_path) {
    const { data } = supabase.storage
      .from("engagement-logos")
      .getPublicUrl(company.logo_storage_path);
    clientLogoUrl = data.publicUrl;
  }

  const firstName = client?.first_name ?? "";
  const lastName = client?.last_name ?? "";

  return {
    clientSlug: engagement.client_slug,
    clientName: company?.name ?? "",
    engagementTitle: engagement.engagement_title,
    totalFee: engagement.total_fee,
    finalDeliveryDate: engagement.final_delivery_date,
    companyId: engagement.company_id,
    clientId: engagement.client_id,
    clientSignatoryName: `${firstName} ${lastName}`.trim(),
    clientSignatoryFirstName: firstName,
    clientSignatoryLastName: lastName,
    clientSignatoryEmail: client?.email ?? "",
    fonderSignatoryName: engagement.fonder_signatory_name,
    fonderSignatoryEmail: engagement.fonder_signatory_email,
    documentStoragePath: engagement.document_storage_path,
    clientLogoUrl,
    sowContentMarkdown: engagement.sow_content_markdown,
    msaContentMarkdown: engagement.msa_content_markdown,
    team: (teamRows ?? []).map((t) => ({
      name: t.name,
      role: t.role,
      blurb: t.blurb ?? undefined,
      iconBgColor: t.icon_bg_color,
      iconTextColor: t.icon_text_color,
    })),
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
