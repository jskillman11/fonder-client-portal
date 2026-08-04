import { NextRequest, NextResponse } from "next/server";
import { createCompany } from "@/lib/companies-clients";
import { requireAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const formData = await req.formData();
  const name = formData.get("name") as string;
  const logo = formData.get("logo") as File | null;
  const logoDomain = formData.get("logoDomain") as string | null;
  const logoBackgroundColor = (formData.get("logoBackgroundColor") as string | null) || "#ffffff";

  if (!name?.trim()) {
    return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  }

  const result = await createCompany(name, logo, logoDomain, logoBackgroundColor);
  if ("error" in result) {
    return NextResponse.json({ error: "Failed to create company", detail: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: result.id });
}
