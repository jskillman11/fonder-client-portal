import { NextRequest, NextResponse } from "next/server";
import { deleteClientRecord } from "@/lib/companies-clients";
import { requireAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const result = await deleteClientRecord(id);
  if ("error" in result) {
    return NextResponse.json(
      {
        error: "Failed to delete client",
        detail:
          result.error.includes("foreign key") || result.error.includes("violates")
            ? "This client is linked to an engagement — remove or reassign that engagement first."
            : result.error,
      },
      { status: 500 },
    );
  }
  return NextResponse.json({ success: true });
}
