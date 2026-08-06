import { NextRequest, NextResponse } from "next/server";
import { createServerAuthClient } from "@/lib/supabase/server";

// Completes the Google OAuth redirect started by the "Continue with
// Google" button on /admin/login -- exchanges the PKCE code Supabase
// appends to our redirectTo for a real session (see verify/[token]/route.ts
// for the equivalent client magic-link flow).
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createServerAuthClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/admin`);
    }
  }

  return NextResponse.redirect(`${origin}/admin/login?error=oauth_failed`);
}
