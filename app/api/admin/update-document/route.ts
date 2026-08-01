import { NextRequest, NextResponse } from "next/server";
import { updateDocument } from "@/lib/documents";
import { requireAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id, title, contentMarkdown } = await req.json();
  if (!id || !title?.trim() || !contentMarkdown?.trim()) {
    return NextResponse.json({ error: "title and content are required" }, { status: 400 });
  }
  const result = await updateDocument(id, title, contentMarkdown);
  if ("error" in result) {
    return NextResponse.json({ error: "Failed to update document", detail: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
