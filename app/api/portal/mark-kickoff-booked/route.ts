import { NextRequest, NextResponse } from "next/server";
import { getEngagement } from "@/lib/get-engagement";
import { createServiceClient } from "@/lib/supabase/server";

// Called client-side once Cal.com's embed reports a real booking
// (bookingSuccessfulV2, see components/KickoffScheduler.tsx). Persisted so
// the global portal tab unlock survives a refresh, same reasoning as
// sow_signed_at/msa_signed_at -- engagement-scoped (per-contract), not
// company-scoped, so a new engagement doesn't inherit a previous one's
// booking.
export async function POST(req: NextRequest) {
  const { clientSlug, startTime } = await req.json();
  if (!clientSlug) {
    return NextResponse.json({ error: "clientSlug is required" }, { status: 400 });
  }

  const engagement = await getEngagement(clientSlug);
  if (!engagement) {
    return NextResponse.json({ error: "Unknown client" }, { status: 404 });
  }

  const supabase = createServiceClient();
  await supabase
    .from("engagements")
    .update({
      kickoff_booked_at: new Date().toISOString(),
      kickoff_start_time: startTime || null,
    })
    .eq("id", engagement.id);

  return NextResponse.json({ success: true });
}
