import { NextRequest, NextResponse } from "next/server";
import { updateStaffSuperAdmin } from "@/lib/staff";
import { requireSuperAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id, isSuperAdmin } = await req.json();
  if (!id || typeof isSuperAdmin !== "boolean") {
    return NextResponse.json({ error: "id and isSuperAdmin are required" }, { status: 400 });
  }

  const result = await updateStaffSuperAdmin(id, isSuperAdmin);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
