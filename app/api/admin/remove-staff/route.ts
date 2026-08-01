import { NextRequest, NextResponse } from "next/server";
import { removeStaff } from "@/lib/staff";
import { requireSuperAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const result = await removeStaff(id, admin.id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
