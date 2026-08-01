import { NextRequest, NextResponse } from "next/server";
import { createServerAuthClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const origin = new URL(req.url).origin;

  const supabase = await createServerAuthClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: token, type: "invite" });

  if (error) {
    return NextResponse.redirect(`${origin}/admin/login?error=invalid_invite`);
  }

  return NextResponse.redirect(`${origin}/admin/invite/set-password`);
}
