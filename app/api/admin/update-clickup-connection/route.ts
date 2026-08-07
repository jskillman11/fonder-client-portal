import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/supabase/server";
import { saveApiToken } from "@/lib/clickup";

export async function POST(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (admin instanceof NextResponse) return admin;

  const { apiToken } = await req.json();
  if (!apiToken?.trim()) {
    return NextResponse.json({ error: "API token is required" }, { status: 400 });
  }

  const result = await saveApiToken(apiToken.trim(), admin.email);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
