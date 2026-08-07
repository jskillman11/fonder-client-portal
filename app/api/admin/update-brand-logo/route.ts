import { NextRequest, NextResponse } from "next/server";
import { updateBrandLogo } from "@/lib/brand-settings";
import { requireSuperAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (admin instanceof NextResponse) return admin;

  const formData = await req.formData();
  const removeLogo = formData.get("removeLogo") === "true";
  const logo = formData.get("logo") as File | null;

  const result = await updateBrandLogo(removeLogo ? null : logo, removeLogo);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
