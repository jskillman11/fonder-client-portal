import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const engagementRaw = formData.get("engagement");
  const logo = formData.get("logo") as File | null;

  if (!engagementRaw || typeof engagementRaw !== "string") {
    return NextResponse.json(
      { error: "Missing engagement data" },
      { status: 400 },
    );
  }

  const engagement = JSON.parse(engagementRaw);
  const supabase = createServiceClient();

  // Note: document_storage_path is intentionally NOT touched here anymore --
  // content now lives as Markdown (sow_content_markdown / msa_content_markdown)
  // and is rendered natively + turned into a PDF only at sign-time. That
  // column is reserved for a future step: storing the final, fully-executed
  // PDF once Documenso's webhook reports a completed signature.

  let clientLogoStoragePath: string | null = null;

  if (logo) {
    const ext = logo.name.split(".").pop() || "png";
    clientLogoStoragePath = `${engagement.clientSlug}/logo.${ext}`;
    const { error: logoUploadError } = await supabase.storage
      .from("engagement-logos")
      .upload(clientLogoStoragePath, logo, {
        contentType: logo.type || "image/png",
        upsert: true,
      });

    if (logoUploadError) {
      return NextResponse.json(
        { error: "Failed to upload logo", detail: logoUploadError.message },
        { status: 500 },
      );
    }
  } else {
    // Same reasoning as the PDF above -- preserve whatever logo already
    // exists rather than wiping it out just because no new one was sent.
    const { data: existingLogo } = await supabase
      .from("engagements")
      .select("client_logo_storage_path")
      .eq("client_slug", engagement.clientSlug)
      .maybeSingle();
    clientLogoStoragePath = existingLogo?.client_logo_storage_path ?? null;
  }

  const { data: engagementRow, error: insertError } = await supabase
    .from("engagements")
    .upsert(
      {
        client_slug: engagement.clientSlug,
        client_name: engagement.clientName,
        engagement_title: engagement.engagementTitle,
        total_fee: engagement.totalFee,
        final_delivery_date: engagement.finalDeliveryDate,
        client_signatory_name: engagement.clientSignatoryName,
        client_signatory_email: engagement.clientSignatoryEmail,
        transcript: engagement.transcript || null,
        notes: engagement.notes || null,
        sow_content_markdown: engagement.sowContentMarkdown || null,
        msa_content_markdown: engagement.msaContentMarkdown || null,
        client_logo_storage_path: clientLogoStoragePath,
      },
      { onConflict: "client_slug" },
    )
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to save engagement", detail: insertError.message },
      { status: 500 },
    );
  }

  // Replace team members cleanly rather than trying to diff/merge.
  await supabase
    .from("engagement_team_members")
    .delete()
    .eq("engagement_id", engagementRow.id);

  const teamRows = (engagement.team || [])
    .filter((m: { name: string }) => m.name?.trim())
    .map((m: { name: string; role: string; blurb: string }, i: number) => ({
      engagement_id: engagementRow.id,
      name: m.name,
      role: m.role,
      blurb: m.blurb || null,
      sort_order: i,
    }));

  if (teamRows.length > 0) {
    const { error: teamError } = await supabase
      .from("engagement_team_members")
      .insert(teamRows);

    if (teamError) {
      return NextResponse.json(
        { error: "Saved engagement but failed to save team", detail: teamError.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ success: true, clientSlug: engagement.clientSlug });
}
