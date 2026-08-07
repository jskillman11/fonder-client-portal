import { NextRequest, NextResponse } from "next/server";
import { linkTeamMemberToStaff } from "@/lib/team-members";
import { requireAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id, staffId } = await req.json();
  if (!id || !staffId) {
    return NextResponse.json({ error: "id and staffId are required" }, { status: 400 });
  }
  const result = await linkTeamMemberToStaff(id, staffId);
  if ("error" in result) {
    return NextResponse.json({ error: "Failed to link team member", detail: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
