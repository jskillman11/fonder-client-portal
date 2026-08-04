import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const body = await req.json();
  const { companyId, clientId, clientSlug } = body;

  if (!companyId || !clientId) {
    return NextResponse.json(
      { error: "A company and client must be selected" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  // The portal slug is only ever collected once per company, on that
  // company's very first engagement. Guarded with .is("client_slug", null)
  // so an existing slug can never be silently overwritten even if one is
  // sent again by mistake.
  if (clientSlug) {
    const { error: slugError } = await supabase
      .from("companies")
      .update({ client_slug: clientSlug })
      .eq("id", companyId)
      .is("client_slug", null);

    if (slugError) {
      return NextResponse.json(
        {
          error: "Failed to save engagement",
          detail: slugError.message.includes("duplicate key")
            ? "That portal slug is already taken — choose another."
            : slugError.message,
        },
        { status: 500 },
      );
    }
  }

  const { data: engagementRow, error: insertError } = await supabase
    .from("engagements")
    .insert({
      company_id: companyId,
      client_id: clientId,
      engagement_title: body.engagementTitle,
      total_fee: body.totalFee,
      total_fee_amount: body.totalFeeAmount ? Number(body.totalFeeAmount) : null,
      final_delivery_date: body.finalDeliveryDate,
      kickoff_earliest_date: body.kickoffEarliestDate || null,
      scope_summary: body.scopeSummary || null,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      {
        error: "Failed to save engagement",
        detail: insertError.message.includes("engagements_one_active_per_company")
          ? "This company already has an active engagement — mark it completed first."
          : insertError.message,
      },
      { status: 500 },
    );
  }

  const milestones: { label: string; date: string }[] = body.milestones || [];
  const validMilestones = milestones.filter((m) => m.label?.trim() && m.date);
  if (validMilestones.length > 0) {
    const milestoneRows = validMilestones.map((m, i) => ({
      engagement_id: engagementRow.id,
      label: m.label,
      milestone_date: m.date,
      sort_order: i,
    }));

    const { error: milestoneError } = await supabase
      .from("engagement_milestones")
      .insert(milestoneRows);

    if (milestoneError) {
      return NextResponse.json(
        { error: "Saved engagement but failed to save schedule", detail: milestoneError.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ success: true, engagementId: engagementRow.id });
}
