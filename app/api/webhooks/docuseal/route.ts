import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

// Receives events from DocuSeal. Register this URL in DocuSeal's console
// under Webhooks: https://[your-vercel-domain]/api/webhooks/docuseal --
// generate an HMAC secret from the Security tab and set it as
// DOCUSEAL_WEBHOOK_SECRET.
//
// Two event types are handled, for two different reasons:
// - form.completed (fires once per signer): the client's own portal tabs
//   should unlock as soon as the CLIENT has signed, not be blocked on
//   whether Fonder's internal signatory has gotten around to
//   countersigning yet. Filtered to role === "Client" so Fonder's own
//   completion doesn't (redundantly, but harmlessly) re-trigger the same
//   update.
// - submission.completed (fires once, only after BOTH the client and
//   Fonder's signatory have finished): this is the point a fully-executed
//   PDF actually exists, so it's the trigger to fetch and permanently store
//   the signed document for the client-facing Documents tab.
//
// Correlating an event back to a company needs no DB lookup: the
// external_id set at submission-creation time ("companyId:docType", see
// app/api/sign/create-session/route.ts) is echoed back verbatim on
// `data.external_id` (form.completed) / each submitter's `external_id`
// (submission.completed).
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

type SupabaseClient = ReturnType<typeof createServiceClient>;

async function resolveActiveEngagement(
  supabase: SupabaseClient,
  externalId: string | undefined,
): Promise<{ engagementId: string; docType: "sow" | "msa" } | null> {
  if (!externalId || !externalId.includes(":")) return null;
  const [companyId, docType] = externalId.split(":");
  if (docType !== "sow" && docType !== "msa") return null;

  const { data: activeEngagement } = await supabase
    .from("engagements")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "active")
    .maybeSingle();

  if (!activeEngagement) return null;
  return { engagementId: activeEngagement.id, docType };
}

// DocuSeal's document download URLs are signed and expirable by default,
// working without an auth header -- only accounts with "enforce API token
// for downloads" turned on need X-Auth-Token, so try unauthenticated first.
async function fetchDocuSealDocument(url: string): Promise<Buffer> {
  let res = await fetch(url);

  if ((res.status === 401 || res.status === 403) && process.env.DOCUSEAL_API_KEY) {
    res = await fetch(url, { headers: { "X-Auth-Token": process.env.DOCUSEAL_API_KEY } });
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch DocuSeal document (${res.status})`);
  }

  return Buffer.from(await res.arrayBuffer());
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
  const data = payload?.data;
  const supabase = createServiceClient();

  if (eventType === "form.completed") {
    if (data?.role !== "Client") {
      return NextResponse.json({ received: true });
    }

    const resolved = await resolveActiveEngagement(supabase, data?.external_id);
    if (!resolved) {
      console.log("DocuSeal webhook: form.completed (Client) with no resolvable engagement", {
        externalId: data?.external_id,
      });
      return NextResponse.json({ received: true });
    }

    const signedColumn = resolved.docType === "sow" ? "sow_signed_at" : "msa_signed_at";
    await supabase
      .from("engagements")
      .update({ [signedColumn]: new Date().toISOString() })
      .eq("id", resolved.engagementId);

    return NextResponse.json({ received: true });
  }

  if (eventType === "submission.completed") {
    const submitterExternalId = Array.isArray(data?.submitters)
      ? data.submitters[0]?.external_id
      : undefined;

    const resolved = await resolveActiveEngagement(supabase, submitterExternalId);
    if (!resolved) {
      console.log("DocuSeal webhook: submission.completed with no resolvable engagement", {
        externalId: submitterExternalId,
      });
      return NextResponse.json({ received: true });
    }

    const documents = data?.documents;
    if (!Array.isArray(documents) || documents.length === 0) {
      console.log("DocuSeal webhook: submission.completed with no documents array", { data });
      return NextResponse.json({ received: true });
    }

    try {
      const path = `${resolved.engagementId}/${resolved.docType}.pdf`;
      const bytes = await fetchDocuSealDocument(documents[0].url);

      await supabase.storage
        .from("engagement-documents")
        .upload(path, bytes, { contentType: "application/pdf", upsert: true });

      const pathColumn =
        resolved.docType === "sow" ? "sow_signed_document_path" : "msa_signed_document_path";
      await supabase.from("engagements").update({ [pathColumn]: path }).eq("id", resolved.engagementId);
    } catch (err) {
      console.log("DocuSeal webhook: failed to store signed document", {
        engagementId: resolved.engagementId,
        docType: resolved.docType,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return NextResponse.json({ received: true });
  }

  // Always ack 200 once past signature verification, even for events we
  // don't act on -- avoids DocuSeal retry storms.
  return NextResponse.json({ received: true });
}
