import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireSuperAdmin } from "@/lib/supabase/server";

// Starts the single-tenant QuickBooks OAuth dance -- there is exactly one
// QuickBooks connection for the whole app (Fonder's own company), so this
// is gated to super-admins only, same tier as staff management.
export async function GET() {
  const admin = await requireSuperAdmin();
  if (admin instanceof NextResponse) return admin;

  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "QUICKBOOKS_CLIENT_ID / QUICKBOOKS_REDIRECT_URI are not configured" },
      { status: 500 },
    );
  }

  const state = crypto.randomBytes(16).toString("hex");

  const authorizeUrl = new URL("https://appcenter.intuit.com/connect/oauth2");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "com.intuit.quickbooks.accounting");
  authorizeUrl.searchParams.set("state", state);

  const res = NextResponse.redirect(authorizeUrl.toString());
  res.cookies.set("qb_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
