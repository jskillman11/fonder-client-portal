import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { companyId, teamMemberIds } = await req.json();

  if (!companyId) {
    return NextResponse.json({ error: "companyId is required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Replace cleanly rather than trying to diff/merge.
  await supabase.from("company_team_assignments").delete().eq("company_id", companyId);

  const ids: string[] = teamMemberIds || [];
  if (ids.length > 0) {
    const rows = ids.map((teamMemberId, i) => ({
      company_id: companyId,
      team_member_id: teamMemberId,
      sort_order: i,
    }));

    const { error } = await supabase.from("company_team_assignments").insert(rows);
    if (error) {
      return NextResponse.json(
        { error: "Failed to save team assignments", detail: error.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ success: true });
}
