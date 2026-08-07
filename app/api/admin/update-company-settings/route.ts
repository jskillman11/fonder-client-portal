import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireAdmin } from "@/lib/supabase/server";

// Maps the camelCase body keys the company page's Documents-in-force/
// Shared Drive/Portal content sections may send to their snake_case
// columns -- only keys actually present in the body are applied, so each
// section can save its own slice without clobbering the others.
const COLUMN_MAP: Record<string, string> = {
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
  const { companyId } = body;

  if (!companyId) {
    return NextResponse.json({ error: "companyId is required" }, { status: 400 });
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

  // Swapping which SOW/MSA document is in force invalidates any existing
  // signature for that doc type -- the client needs to sign the document
  // that's actually current, not inherit "signed" from whatever was
  // swapped out.
  if ("sow_document_id" in update || "msa_document_id" in update) {
    const { data: current } = await supabase
      .from("companies")
      .select("sow_document_id, msa_document_id")
      .eq("id", companyId)
      .single();

    if (current) {
      if ("sow_document_id" in update && update.sow_document_id !== current.sow_document_id) {
        update.sow_signed_at = null;
        update.sow_signed_document_path = null;
      }
      if ("msa_document_id" in update && update.msa_document_id !== current.msa_document_id) {
        update.msa_signed_at = null;
        update.msa_signed_document_path = null;
      }
    }
  }

  const { error } = await supabase
    .from("companies")
    .update(update)
    .eq("id", companyId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to save company settings", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
