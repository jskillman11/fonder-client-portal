import { NextResponse } from "next/server";
import { getPortalCopy } from "@/lib/portal-copy";
import { requireAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const copy = await getPortalCopy();
  return NextResponse.json(copy);
}
