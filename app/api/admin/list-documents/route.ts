import { NextResponse } from "next/server";
import { listDocuments } from "@/lib/documents";
import { requireAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const documents = await listDocuments();
  return NextResponse.json({ documents });
}
