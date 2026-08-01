import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireAdmin } from "@/lib/supabase/server";
import { PortalCopyKey } from "@/lib/portal-copy";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const body = (await req.json()) as Record<PortalCopyKey, string>;
  const supabase = createServiceClient();

  const rows = Object.entries(body).map(([content_key, content_value]) => ({
    content_key,
    content_value,
  }));

  const { error } = await supabase
    .from("portal_copy")
    .upsert(rows, { onConflict: "content_key" });

  if (error) {
    return NextResponse.json(
      { error: "Failed to save portal copy", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
