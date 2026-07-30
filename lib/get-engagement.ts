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
    .select("client_slug, client_name, engagement_title")
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    clientSlug: row.client_slug,
    clientName: row.client_name,
    engagementTitle: row.engagement_title,
  }));
}

export async function getEngagement(
  clientSlug: string,
): Promise<EngagementData | null> {
  const supabase = createServiceClient();

  const { data: engagement, error } = await supabase
    .from("engagements")
    .select("*")
    .eq("client_slug", clientSlug)
    .single();

  if (error || !engagement) return null;

  const { data: teamRows } = await supabase
    .from("engagement_team_members")
    .select("name, role, blurb, icon_bg_color, icon_text_color")
    .eq("engagement_id", engagement.id)
    .order("sort_order", { ascending: true });

  let clientLogoUrl: string | null = null;
  if (engagement.client_logo_storage_path) {
    const { data } = supabase.storage
      .from("engagement-logos")
      .getPublicUrl(engagement.client_logo_storage_path);
    clientLogoUrl = data.publicUrl;
  }

  return {
    clientSlug: engagement.client_slug,
    clientName: engagement.client_name,
    engagementTitle: engagement.engagement_title,
    totalFee: engagement.total_fee,
    finalDeliveryDate: engagement.final_delivery_date,
    clientSignatoryName: engagement.client_signatory_name,
    clientSignatoryFirstName: engagement.client_signatory_first_name ?? "",
    clientSignatoryLastName: engagement.client_signatory_last_name ?? "",
    clientSignatoryEmail: engagement.client_signatory_email,
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
