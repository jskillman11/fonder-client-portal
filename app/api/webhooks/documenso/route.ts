import { NextRequest, NextResponse } from "next/server";

// Receives events from Documenso when a document is completed (fully signed
// by all parties). Configure this URL inside Documenso's Settings > Webhooks
// once deployed: https://[your-vercel-domain]/api/webhooks/documenso
//
// For now this just logs the event — the natural next step once this is
// working is to trigger a branded Resend email here (to both signers, with
// the completed PDF) instead of relying on Documenso's own default email.

export async function POST(req: NextRequest) {
  const payload = await req.json();

  // TODO(integration): once confirmed working, branch on payload.event
  // (Documenso sends event types like "DOCUMENT_COMPLETED") and:
  //   1. Look up which client this document belongs to
  //   2. Send a branded confirmation email via Resend to both signers
  //   3. Optionally store the completion record somewhere (e.g. Supabase)
  //      if you want a status dashboard later

  console.log("Documenso webhook received:", JSON.stringify(payload));

  return NextResponse.json({ received: true });
}
