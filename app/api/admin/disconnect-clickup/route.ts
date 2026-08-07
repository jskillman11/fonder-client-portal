import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/supabase/server";
import { disconnectClickUp } from "@/lib/clickup";

export async function POST() {
  const admin = await requireSuperAdmin();
  if (admin instanceof NextResponse) return admin;

  await disconnectClickUp();
  return NextResponse.json({ success: true });
}
