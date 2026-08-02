import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireAdmin } from "@/lib/supabase/server";

// Maps the camelCase body keys each engagement tab may send to their
// snake_case columns -- only keys actually present in the body are applied,
// so each tab can save its own slice without clobbering the others.
const COLUMN_MAP: Record<string, string> = {
  clientId: "client_id",
  engagementTitle: "engagement_title",
  totalFee: "total_fee",
  finalDeliveryDate: "final_delivery_date",
  kickoffEarliestDate: "kickoff_earliest_date",
  scopeSummary: "scope_summary",
  sowDocumentId: "sow_document_id",
  msaDocumentId: "msa_document_id",
  lockPortalTabs: "lock_portal_tabs",
  sharedDriveUrl: "shared_drive_url",
  tabLockOverrides: "tab_lock_overrides",
};

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const body = await req.json();
  const { engagementId } = body;

  if (!engagementId) {
    return NextResponse.json({ error: "engagementId is required" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  for (const [bodyKey, column] of Object.entries(COLUMN_MAP)) {
    if (Object.prototype.hasOwnProperty.call(body, bodyKey)) {
      update[column] = body[bodyKey];
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("engagements")
    .update(update)
    .eq("id", engagementId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to save engagement", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
