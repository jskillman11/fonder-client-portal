import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const engagementRaw = formData.get("engagement");
  const pdf = formData.get("pdf") as File | null;

  if (!engagementRaw || typeof engagementRaw !== "string") {
    return NextResponse.json(
      { error: "Missing engagement data" },
      { status: 400 },
    );
  }

  const engagement = JSON.parse(engagementRaw);
  const supabase = createServiceClient();

  let documentStoragePath: string | null = null;

  if (pdf) {
    documentStoragePath = `${engagement.clientSlug}/sow-msa.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("engagement-documents")
      .upload(documentStoragePath, pdf, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Failed to upload PDF", detail: uploadError.message },
        { status: 500 },
      );
    }
  } else {
    // No new PDF was uploaded -- this must be an edit of an existing client.
    // Look up whatever's already stored so we don't accidentally null it out.
    const { data: existing } = await supabase
      .from("engagements")
      .select("document_storage_path")
      .eq("client_slug", engagement.clientSlug)
      .maybeSingle();
    documentStoragePath = existing?.document_storage_path ?? null;
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
        document_storage_path: documentStoragePath,
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
