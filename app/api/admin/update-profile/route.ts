import { NextRequest, NextResponse } from "next/server";
import { updateStaffProfile } from "@/lib/staff-profile";
import { requireAdmin, isSuperAdminSession } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const formData = await req.formData();
  const targetUserId = (formData.get("userId") as string | null) || admin.id;
  const fullName = formData.get("fullName") as string;
  const jobTitle = (formData.get("jobTitle") as string | null) ?? "";
  const photo = formData.get("photo") as File | null;
  const iconBgColor = (formData.get("iconBgColor") as string | null) || null;
  const iconTextColor = (formData.get("iconTextColor") as string | null) || null;

  if (targetUserId !== admin.id && !(await isSuperAdminSession())) {
    return NextResponse.json({ error: "Super-admin access required to edit another profile" }, { status: 403 });
  }

  if (!fullName?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const result = await updateStaffProfile(targetUserId, fullName, jobTitle, photo, iconBgColor, iconTextColor);
  if ("error" in result) {
    return NextResponse.json({ error: "Failed to update profile", detail: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
