import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPortalCookieName } from "@/lib/portal-access";

export async function POST(req: NextRequest) {
  const { clientSlug } = await req.json();

  if (!clientSlug) {
    return NextResponse.json({ error: "Missing clientSlug" }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.delete(getPortalCookieName(clientSlug));

  return NextResponse.json({ success: true });
}
