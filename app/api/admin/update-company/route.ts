import { NextRequest, NextResponse } from "next/server";
import { updateCompany } from "@/lib/companies-clients";
import { requireAdmin } from "@/lib/supabase/server";

// Textareas collect one id per line -- split/trim/drop-empty into a plain
// string array for the clickup_list_ids/google_sheet_ids text[] columns.
function parseIdList(raw: string | null): string[] | null {
  if (raw === null) return null;
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const formData = await req.formData();
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const logo = formData.get("logo") as File | null;
  const logoDomain = formData.get("logoDomain") as string | null;
  const logoBackgroundColor = formData.get("logoBackgroundColor") as string | null;
  const removeLogo = formData.get("removeLogo") === "true";
  const clickupListIds = parseIdList(formData.get("clickupListIds") as string | null);
  const googleSheetIds = parseIdList(formData.get("googleSheetIds") as string | null);

  if (!id || !name?.trim()) {
    return NextResponse.json({ error: "id and name are required" }, { status: 400 });
  }

  const result = await updateCompany(
    id,
    name,
    logo,
    logoDomain,
    logoBackgroundColor,
    removeLogo,
    clickupListIds,
    googleSheetIds,
  );
  if ("error" in result) {
    return NextResponse.json({ error: "Failed to update company", detail: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
