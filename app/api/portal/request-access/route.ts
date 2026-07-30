import { NextRequest, NextResponse } from "next/server";
import { createAndSendMagicLink } from "@/lib/portal-access";

export async function POST(req: NextRequest) {
  const { clientSlug, email } = await req.json();
  if (!clientSlug || !email) {
    return NextResponse.json({ error: "clientSlug and email are required" }, { status: 400 });
  }

  const origin = req.headers.get("origin") || new URL(req.url).origin;
  const result = await createAndSendMagicLink(clientSlug, email, origin);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
