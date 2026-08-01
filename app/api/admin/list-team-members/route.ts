import { NextResponse } from "next/server";
import { listTeamMembers } from "@/lib/team-members";
import { requireAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const teamMembers = await listTeamMembers();
  return NextResponse.json({ teamMembers });
}
