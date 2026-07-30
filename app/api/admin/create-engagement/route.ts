import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const engagement = await req.json();
  const supabase = createServiceClient();

  if (!engagement.companyId || !engagement.clientId) {
    return NextResponse.json(
      { error: "A company and client must be selected" },
      { status: 400 },
    );
  }

  const { data: engagementRow, error: insertError } = await supabase
    .from("engagements")
    .upsert(
      {
        client_slug: engagement.clientSlug,
        company_id: engagement.companyId,
        client_id: engagement.clientId,
        engagement_title: engagement.engagementTitle,
        total_fee: engagement.totalFee,
        final_delivery_date: engagement.finalDeliveryDate,
        sow_document_id: engagement.sowDocumentId || null,
        msa_document_id: engagement.msaDocumentId || null,
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

  // Replace team assignments cleanly rather than trying to diff/merge.
  await supabase
    .from("engagement_team_assignments")
    .delete()
    .eq("engagement_id", engagementRow.id);

  const teamMemberIds: string[] = engagement.teamMemberIds || [];
  if (teamMemberIds.length > 0) {
    const assignmentRows = teamMemberIds.map((teamMemberId, i) => ({
      engagement_id: engagementRow.id,
      team_member_id: teamMemberId,
      sort_order: i,
    }));

    const { error: teamError } = await supabase
      .from("engagement_team_assignments")
      .insert(assignmentRows);

    if (teamError) {
      return NextResponse.json(
        { error: "Saved engagement but failed to save team assignments", detail: teamError.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ success: true, clientSlug: engagement.clientSlug });
}
