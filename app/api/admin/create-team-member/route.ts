import { NextRequest, NextResponse } from "next/server";
import { createTeamMember } from "@/lib/team-members";
import { requireAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { name, role, staffId } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!staffId) {
    return NextResponse.json({ error: "A staff account is required" }, { status: 400 });
  }
  const result = await createTeamMember(name, role || "", null, null, staffId);
  if ("error" in result) {
    return NextResponse.json({ error: "Failed to create team member", detail: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true, id: result.id });
}
