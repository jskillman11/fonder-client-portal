import { NextRequest, NextResponse } from "next/server";
import { createClientRecord } from "@/lib/companies-clients";
import { requireAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { companyId, firstName, lastName, email } = await req.json();

  if (!companyId || !firstName?.trim() || !lastName?.trim() || !email?.trim()) {
    return NextResponse.json(
      { error: "companyId, firstName, lastName, and email are all required" },
      { status: 400 },
    );
  }

  const result = await createClientRecord(companyId, firstName, lastName, email);
  if ("error" in result) {
    return NextResponse.json({ error: "Failed to create client", detail: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: result.id });
}
