import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Receives events from Documenso when a document is completed (fully signed
// by all parties). Configure this URL inside Documenso's Settings > Webhooks
// once deployed: https://[your-vercel-domain]/api/webhooks/documenso -- set
// a shared secret there and put the same value in DOCUMENSO_WEBHOOK_SECRET.
// Confirm the exact header Documenso sends the secret in against their
// dashboard once you register the webhook -- implemented here as
// `X-Documenso-Secret`, adjust if theirs differs.
//
// Payload shape assumed (per Documenso's documented webhook format --
// verify with their dashboard's "send test webhook" feature once live, and
// adjust the parsing below if the real shape differs):
//   { event: "DOCUMENT_COMPLETED", payload: { id: <documentId>, ... } }
//
// This is the source of truth for whether a client has actually finished
// signing -- see lib/get-engagement.ts's sowSigned/msaSigned, sourced from
// companies.sow_signed_at/msa_signed_at, which this route sets.

const COMPLETION_EVENTS = new Set(["DOCUMENT_COMPLETED"]);

export async function POST(req: NextRequest) {
  const configuredSecret = process.env.DOCUMENSO_WEBHOOK_SECRET;
  if (configuredSecret) {
    const incomingSecret = req.headers.get("x-documenso-secret");
    if (incomingSecret !== configuredSecret) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const payload = await req.json();
  const event = payload?.event;
  const documentId = payload?.payload?.id;

  // Always ack 200 once the request is authenticated, even for events we
  // don't act on or can't match -- avoids Documenso retry storms. Only the
  // unmatched-completion case below is worth logging loudly, since that's
  // the signal the payload-shape assumption above needs adjusting.
  if (!COMPLETION_EVENTS.has(event) || documentId == null) {
    return NextResponse.json({ received: true });
  }

  const supabase = createServiceClient();
  const documentIdStr = String(documentId);

  const { data: sowMatch } = await supabase
    .from("companies")
    .select("id")
    .eq("sow_documenso_document_id", documentIdStr)
    .maybeSingle();

  if (sowMatch) {
    await supabase
      .from("companies")
      .update({ sow_signed_at: new Date().toISOString() })
      .eq("id", sowMatch.id);
    return NextResponse.json({ received: true });
  }

  const { data: msaMatch } = await supabase
    .from("companies")
    .select("id")
    .eq("msa_documenso_document_id", documentIdStr)
    .maybeSingle();

  if (msaMatch) {
    await supabase
      .from("companies")
      .update({ msa_signed_at: new Date().toISOString() })
      .eq("id", msaMatch.id);
    return NextResponse.json({ received: true });
  }

  console.log(
    "Documenso webhook: completion event didn't match any company's sow/msa document id",
    { event, documentId },
  );

  return NextResponse.json({ received: true });
}
