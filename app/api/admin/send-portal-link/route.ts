import { NextRequest, NextResponse } from "next/server";
import { getEngagement } from "@/lib/get-engagement";
import { createAndSendMagicLink } from "@/lib/portal-access";
import { requireAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { clientSlug } = await req.json();
  if (!clientSlug) return NextResponse.json({ error: "clientSlug is required" }, { status: 400 });

  const engagement = await getEngagement(clientSlug);
  if (!engagement) return NextResponse.json({ error: "Unknown client" }, { status: 404 });
  if (!engagement.clientSignatoryEmail) {
    return NextResponse.json({ error: "This client has no registered email yet" }, { status: 400 });
  }

  const origin = req.headers.get("origin") || new URL(req.url).origin;
  const result = await createAndSendMagicLink(clientSlug, engagement.clientSignatoryEmail, origin);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
