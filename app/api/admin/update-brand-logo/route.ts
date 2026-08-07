import { NextRequest, NextResponse } from "next/server";
import { updateBrandLogo, type BrandLogoSlot } from "@/lib/brand-settings";
import { requireSuperAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (admin instanceof NextResponse) return admin;

  const formData = await req.formData();
  const slot = formData.get("slot") as BrandLogoSlot | null;
  const removeLogo = formData.get("removeLogo") === "true";
  const logo = formData.get("logo") as File | null;

  if (slot !== "login" && slot !== "sidebar") {
    return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
  }

  const result = await updateBrandLogo(slot, removeLogo ? null : logo, removeLogo);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
