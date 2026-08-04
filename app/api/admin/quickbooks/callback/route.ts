import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/supabase/server";
import { saveConnectionFromOAuthCallback } from "@/lib/quickbooks";

const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

// Completes the OAuth dance started by /api/admin/quickbooks/connect --
// Intuit redirects here with ?code&state&realmId after the admin approves
// the connection on QuickBooks' own consent screen.
export async function GET(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const realmId = searchParams.get("realmId");
  const expectedState = req.cookies.get("qb_oauth_state")?.value;

  if (!code || !realmId || !state || !expectedState || state !== expectedState) {
    return NextResponse.json({ error: "Invalid or expired OAuth callback" }, { status: 400 });
  }

  const clientId = process.env.QUICKBOOKS_CLIENT_ID!;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET!;
  const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI!;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.json(
      { error: "Failed to exchange QuickBooks authorization code", detail: await tokenRes.text() },
      { status: 500 },
    );
  }

  const tokens = await tokenRes.json();

  await saveConnectionFromOAuthCallback({
    realmId,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
    refreshTokenExpiresIn: tokens.x_refresh_token_expires_in,
    connectedByEmail: admin.email,
  });

  const res = NextResponse.redirect(new URL("/admin/settings/quickbooks?connected=1", req.url));
  res.cookies.delete("qb_oauth_state");
  return res;
}
