import { NextRequest, NextResponse } from "next/server";
import { updateMyClientProfile } from "@/lib/client-profile";
import { requireClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const client = await requireClient();
  if (client instanceof NextResponse) return client;

  const formData = await req.formData();
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const photo = formData.get("photo") as File | null;

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  const result = await updateMyClientProfile(client.clientId, firstName, lastName, email, photo);
  if ("error" in result) {
    return NextResponse.json({ error: "Failed to update profile", detail: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
