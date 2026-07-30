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
        sow_content_markdown: engagement.sowContentMarkdown || null,
        msa_content_markdown: engagement.msaContentMarkdown || null,
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
    .map(
      (
        m: {
          name: string;
          role: string;
          blurb: string;
          iconBgColor?: string;
          iconTextColor?: string;
        },
        i: number,
      ) => ({
        engagement_id: engagementRow.id,
        name: m.name,
        role: m.role,
        blurb: m.blurb || null,
        icon_bg_color: m.iconBgColor || null,
        icon_text_color: m.iconTextColor || null,
        sort_order: i,
      }),
    );

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
