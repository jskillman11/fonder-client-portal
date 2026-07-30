import { NextRequest, NextResponse } from "next/server";
import { updateClientRecord } from "@/lib/companies-clients";

export async function POST(req: NextRequest) {
  const { id, firstName, lastName, email } = await req.json();
  if (!id || !firstName?.trim() || !lastName?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }
  const result = await updateClientRecord(id, firstName, lastName, email);
  if ("error" in result) {
    return NextResponse.json({ error: "Failed to update client", detail: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
