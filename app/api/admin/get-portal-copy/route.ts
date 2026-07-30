import { NextResponse } from "next/server";
import { getPortalCopy } from "@/lib/portal-copy";

export const dynamic = "force-dynamic";

export async function GET() {
  const copy = await getPortalCopy();
  return NextResponse.json(copy);
}
