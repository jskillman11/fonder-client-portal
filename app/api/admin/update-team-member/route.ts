import { NextRequest, NextResponse } from "next/server";
import { updateTeamMemberRecord } from "@/lib/team-members";
import { requireAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id, name, role, iconBgColor, iconTextColor } = await req.json();
  if (!id || !name?.trim() || !role?.trim()) {
    return NextResponse.json({ error: "Name and role are required" }, { status: 400 });
  }
  const result = await updateTeamMemberRecord(id, name, role, iconBgColor || null, iconTextColor || null);
  if ("error" in result) {
    return NextResponse.json({ error: "Failed to update team member", detail: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
