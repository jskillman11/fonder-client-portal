import { NextRequest, NextResponse } from "next/server";
import { deleteTeamMember } from "@/lib/team-members";

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const result = await deleteTeamMember(id);
  if ("error" in result) {
    return NextResponse.json(
      { error: "Failed to delete team member", detail: result.error },
      { status: 500 },
    );
  }
  return NextResponse.json({ success: true });
}
