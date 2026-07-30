import { NextRequest, NextResponse } from "next/server";
import { deleteClientRecord } from "@/lib/companies-clients";

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const result = await deleteClientRecord(id);
  if ("error" in result) {
    return NextResponse.json({ error: "Failed to delete client", detail: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
