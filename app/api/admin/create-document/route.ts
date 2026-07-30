import { NextRequest, NextResponse } from "next/server";
import { createDocument } from "@/lib/documents";

export async function POST(req: NextRequest) {
  const { companyId, docType, title, contentMarkdown } = await req.json();

  if (!companyId || !docType || !title?.trim() || !contentMarkdown?.trim()) {
    return NextResponse.json(
      { error: "companyId, docType, title, and content are all required" },
      { status: 400 },
    );
  }

  const result = await createDocument(companyId, docType, title, contentMarkdown);
  if ("error" in result) {
    return NextResponse.json({ error: "Failed to create document", detail: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: result.id });
}
