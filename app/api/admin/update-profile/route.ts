import { NextRequest, NextResponse } from "next/server";
import { updateMyProfile } from "@/lib/staff-profile";
import { requireAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const formData = await req.formData();
  const fullName = formData.get("fullName") as string;
  const jobTitle = (formData.get("jobTitle") as string | null) ?? "";
  const photo = formData.get("photo") as File | null;

  if (!fullName?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const result = await updateMyProfile(admin.id, fullName, jobTitle, photo);
  if ("error" in result) {
    return NextResponse.json({ error: "Failed to update profile", detail: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
