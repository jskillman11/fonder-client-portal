import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireAdmin } from "@/lib/supabase/server";

// Textareas collect one id per line -- split/trim/drop-empty into a plain
// string array for the clickup_list_ids/google_sheet_ids text[] columns.
function parseIdList(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { companyId, clickupListIds, googleSheetIds } = await req.json();

  if (!companyId) {
    return NextResponse.json({ error: "companyId is required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("companies")
    .update({
      clickup_list_ids: parseIdList(clickupListIds ?? ""),
      google_sheet_ids: parseIdList(googleSheetIds ?? ""),
    })
    .eq("id", companyId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to save data connectors", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
