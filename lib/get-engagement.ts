import { createServiceClient } from "./supabase/server";

export type TeamMember = { name: string; role: string; blurb?: string };

export type EngagementData = {
  clientSlug: string;
  clientName: string;
  engagementTitle: string;
  totalFee: string;
  finalDeliveryDate: string;
  team: TeamMember[];
  clientSignatoryName: string;
  clientSignatoryEmail: string;
  fonderSignatoryName: string;
  fonderSignatoryEmail: string;
  documentStoragePath: string | null;
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
    .select("name, role, blurb")
    .eq("engagement_id", engagement.id)
    .order("sort_order", { ascending: true });

  return {
    clientSlug: engagement.client_slug,
    clientName: engagement.client_name,
    engagementTitle: engagement.engagement_title,
    totalFee: engagement.total_fee,
    finalDeliveryDate: engagement.final_delivery_date,
    clientSignatoryName: engagement.client_signatory_name,
    clientSignatoryEmail: engagement.client_signatory_email,
    fonderSignatoryName: engagement.fonder_signatory_name,
    fonderSignatoryEmail: engagement.fonder_signatory_email,
    documentStoragePath: engagement.document_storage_path,
    team: teamRows ?? [],
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
