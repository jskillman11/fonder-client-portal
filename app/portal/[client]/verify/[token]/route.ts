import { NextRequest, NextResponse } from "next/server";
import { verifyMagicLinkToken, getPortalCookieName, SESSION_COOKIE_MAX_AGE_DAYS } from "@/lib/portal-access";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ client: string; token: string }> },
) {
  const { client, token } = await params;
  const result = await verifyMagicLinkToken(token);

  const origin = new URL(req.url).origin;

  if (!result || result.clientSlug !== client) {
    return NextResponse.redirect(`${origin}/portal/${client}?error=expired`);
  }

  const response = NextResponse.redirect(`${origin}/portal/${client}`);
  response.cookies.set(getPortalCookieName(client), token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60,
    path: "/",
  });
  return response;
}
