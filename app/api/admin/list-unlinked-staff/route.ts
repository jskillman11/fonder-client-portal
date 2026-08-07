import { NextResponse } from "next/server";
import { listUnlinkedStaffForRoster } from "@/lib/team-members";
import { requireAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const staff = await listUnlinkedStaffForRoster();
  return NextResponse.json({ staff });
}
