import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

// Receives events from DocuSeal when a submission is fully completed (all
// signers finished). Register this URL in DocuSeal's console under
// Webhooks: https://[your-vercel-domain]/api/webhooks/docuseal -- generate
// an HMAC secret from the Security tab and set it as
// DOCUSEAL_WEBHOOK_SECRET.
//
// Correlating an event back to a company needs no DB lookup: the
// external_id set at submission-creation time ("companyId:docType", see
// app/api/sign/create-session/route.ts) is echoed back verbatim on every
// submitter here.
//
// Signature verification per DocuSeal's docs: header X-Docuseal-Signature
// is "{timestamp}.{signature}", where signature = HMAC-SHA256(secret,
// "{timestamp}.{rawBody}"), verified against the RAW request bytes (not
// re-serialized JSON) -- hence reading req.text() before parsing.

function verifySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const [timestamp, signature] = header.split(".", 2);
  if (!timestamp || !signature) return false;

  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const configuredSecret = process.env.DOCUSEAL_WEBHOOK_SECRET;
  if (configuredSecret) {
    const header = req.headers.get("x-docuseal-signature");
    if (!verifySignature(rawBody, header, configuredSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const payload = JSON.parse(rawBody);
  const eventType = payload?.event_type;

  // Always ack 200 once past signature verification, even for events we
  // don't act on -- avoids DocuSeal retry storms. form.completed fires per
  // signer; submission.completed fires once, after ALL signers finish,
  // which is the real "fully signed" signal.
  if (eventType !== "submission.completed") {
    return NextResponse.json({ received: true });
  }

  const submitters = payload?.data?.submitters;
  const externalId: string | undefined = submitters?.[0]?.external_id;

  if (!externalId || !externalId.includes(":")) {
    console.log(
      "DocuSeal webhook: submission.completed with no usable external_id",
      { payload },
    );
    return NextResponse.json({ received: true });
  }

  const [companyId, docType] = externalId.split(":");
  if (docType !== "sow" && docType !== "msa") {
    console.log("DocuSeal webhook: external_id has an unrecognized docType", { externalId });
    return NextResponse.json({ received: true });
  }

  const signedColumn = docType === "sow" ? "sow_signed_at" : "msa_signed_at";
  const supabase = createServiceClient();
  await supabase
    .from("companies")
    .update({ [signedColumn]: new Date().toISOString() })
    .eq("id", companyId);

  return NextResponse.json({ received: true });
}
