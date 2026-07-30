import { NextRequest, NextResponse } from "next/server";
import { deleteCompany } from "@/lib/companies-clients";

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const result = await deleteCompany(id);
  if ("error" in result) {
    return NextResponse.json(
      {
        error: "Failed to delete company",
        detail:
          result.error.includes("foreign key") || result.error.includes("violates")
            ? "This company has engagements still referencing it — remove or reassign those first."
            : result.error,
      },
      { status: 500 },
    );
  }
  return NextResponse.json({ success: true });
}
