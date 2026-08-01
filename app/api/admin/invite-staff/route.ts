import { NextRequest, NextResponse } from "next/server";
import { inviteStaff } from "@/lib/staff";
import { requireSuperAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (admin instanceof NextResponse) return admin;

  const { email, makeSuperAdmin } = await req.json();
  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const origin = req.headers.get("origin") || new URL(req.url).origin;
  const result = await inviteStaff(email, Boolean(makeSuperAdmin), origin);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
