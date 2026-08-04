import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/supabase/server";
import { disconnectQuickBooks } from "@/lib/quickbooks";

export async function POST() {
  const admin = await requireSuperAdmin();
  if (admin instanceof NextResponse) return admin;

  await disconnectQuickBooks();
  return NextResponse.json({ success: true });
}
