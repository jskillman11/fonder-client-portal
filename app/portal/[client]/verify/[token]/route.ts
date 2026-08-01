import { NextRequest, NextResponse } from "next/server";
import { createServerAuthClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ client: string; token: string }> },
) {
  const { client, token } = await params;
  const origin = new URL(req.url).origin;

  const supabase = await createServerAuthClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: token, type: "email" });

  if (error) {
    return NextResponse.redirect(`${origin}/portal/${client}?error=expired`);
  }

  return NextResponse.redirect(`${origin}/portal/${client}`);
}
