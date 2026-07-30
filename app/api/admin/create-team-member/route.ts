import { NextRequest, NextResponse } from "next/server";
import { createTeamMember } from "@/lib/team-members";

export async function POST(req: NextRequest) {
  const { name, role, iconBgColor, iconTextColor } = await req.json();
  if (!name?.trim() || !role?.trim()) {
    return NextResponse.json({ error: "Name and role are required" }, { status: 400 });
  }
  const result = await createTeamMember(name, role, iconBgColor || null, iconTextColor || null);
  if ("error" in result) {
    return NextResponse.json({ error: "Failed to create team member", detail: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true, id: result.id });
}
