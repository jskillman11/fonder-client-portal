import { NextRequest, NextResponse } from "next/server";
import { updateCompany } from "@/lib/companies-clients";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const logo = formData.get("logo") as File | null;

  if (!id || !name?.trim()) {
    return NextResponse.json({ error: "id and name are required" }, { status: 400 });
  }

  const result = await updateCompany(id, name, logo);
  if ("error" in result) {
    return NextResponse.json({ error: "Failed to update company", detail: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
