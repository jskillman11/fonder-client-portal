import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { engagementId, milestones } = await req.json();

  if (!engagementId) {
    return NextResponse.json({ error: "engagementId is required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Replace cleanly rather than trying to diff/merge.
  await supabase.from("engagement_milestones").delete().eq("engagement_id", engagementId);

  const validMilestones: { label: string; date: string }[] = (milestones || []).filter(
    (m: { label?: string; date?: string }) => m.label?.trim() && m.date,
  );

  if (validMilestones.length > 0) {
    const rows = validMilestones.map((m, i) => ({
      engagement_id: engagementId,
      label: m.label,
      milestone_date: m.date,
      sort_order: i,
    }));

    const { error } = await supabase.from("engagement_milestones").insert(rows);
    if (error) {
      return NextResponse.json(
        { error: "Failed to save schedule", detail: error.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ success: true });
}
