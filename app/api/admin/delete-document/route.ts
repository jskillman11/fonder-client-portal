import { NextRequest, NextResponse } from "next/server";
import { deleteDocument } from "@/lib/documents";

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const result = await deleteDocument(id);
  if ("error" in result) {
    return NextResponse.json(
      {
        error: "Failed to delete document",
        detail:
          result.error.includes("foreign key") || result.error.includes("violates")
            ? "This document is still selected on an engagement — update that engagement first."
            : result.error,
      },
      { status: 500 },
    );
  }
  return NextResponse.json({ success: true });
}
