import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireAdmin } from "@/lib/supabase/server";

// Maps the camelCase body keys the engagement Overview form may send to
// their snake_case columns -- only keys actually present in the body are
// applied, so a save or a "mark completed" action can each write just their
// own slice.
const COLUMN_MAP: Record<string, string> = {
  clientId: "client_id",
  engagementTitle: "engagement_title",
  totalFee: "total_fee",
  totalFeeAmount: "total_fee_amount",
  finalDeliveryDate: "final_delivery_date",
  kickoffEarliestDate: "kickoff_earliest_date",
  scopeSummary: "scope_summary",
  status: "status",
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

  // total_fee_amount is a numeric column -- coerce the form's string input
  // (or clear it to null) rather than passing the raw string through.
  if ("total_fee_amount" in update) {
    update.total_fee_amount = update.total_fee_amount ? Number(update.total_fee_amount) : null;
  }

  // kickoff_earliest_date is a real Postgres `date` column (nullable) -- an
  // untouched, empty <input type="date"> sends "" rather than omitting the
  // key, which Postgres rejects outright ("invalid input syntax for type
  // date"). Empty string means "cleared", so treat it the same as null.
  if ("kickoff_earliest_date" in update) {
    update.kickoff_earliest_date = update.kickoff_earliest_date || null;
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("engagements")
    .update(update)
    .eq("id", engagementId);

  if (error) {
    return NextResponse.json(
      {
        error: "Failed to save engagement",
        detail: error.message.includes("engagements_one_active_per_company")
          ? "This company already has an active engagement — mark it completed first."
          : error.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
