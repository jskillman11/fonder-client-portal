import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { getConnectionStatus, getPaymentLinkedInvoiceIds, getInvoice } from "@/lib/quickbooks";

// Receives QuickBooks' CloudEvents-format webhook notifications. Register
// this URL (https://[your-domain]/api/webhooks/quickbooks) in the Intuit
// developer dashboard's Webhooks tab, subscribed to the Invoice and Payment
// entities; copy the generated "Webhooks Verifier Token" (a credential
// distinct from the OAuth Client Secret) into QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN.
//
// Payload format is CloudEvents (mandatory migration completed as of July
// 31 2026) -- a JSON ARRAY of envelopes, not the legacy
// eventNotifications/dataChangeEvent shape:
//   [{ specversion, id, source, type: "qbo.payment.created.v1", time,
//      intuitentityid, intuitaccountid, data: {} }]
// The exact `type` string for Payment events is pattern-inferred (only
// "qbo.customer.created.v1" was verbatim-confirmed in Intuit's own sample),
// so this matches loosely on "payment" appearing in the type and logs every
// unmatched type seen, rather than hardcoding a guessed exact string.
//
// A Payment event is a much stronger "money moved" signal than a generic
// Invoice-changed event: fetch the Payment, walk its LinkedTxn entries back
// to the invoice(s) it was applied to, then check each Invoice's Balance --
// 0 means fully paid.
//
// Signature verification: header intuit-signature =
// base64(HMAC-SHA256(QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN, rawBody)), verified
// against the RAW request bytes before parsing. Different encoding than the
// DocuSeal webhook's hex compare -- easy bug spot if copy-pasted.

function verifySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest();

  let provided: Buffer;
  try {
    provided = Buffer.from(header, "base64");
  } catch {
    return false;
  }

  if (expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(expected, provided);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const configuredSecret = process.env.QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN;
  if (configuredSecret) {
    const header = req.headers.get("intuit-signature");
    if (!verifySignature(rawBody, header, configuredSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let events: unknown;
  try {
    events = JSON.parse(rawBody);
  } catch {
    console.log("QuickBooks webhook: body is not valid JSON");
    return NextResponse.json({ received: true });
  }

  if (!Array.isArray(events)) {
    console.log("QuickBooks webhook: expected a CloudEvents array, got", { events });
    return NextResponse.json({ received: true });
  }

  const connection = await getConnectionStatus();
  const supabase = createServiceClient();

  for (const event of events) {
    const type: string | undefined = event?.type;
    const entityId: string | undefined = event?.intuitentityid;
    const accountId: string | undefined = event?.intuitaccountid;

    if (!type || !entityId) continue;

    if (connection.realmId && accountId && accountId !== connection.realmId) {
      console.log("QuickBooks webhook: event for an unrecognized realm, skipping", { accountId });
      continue;
    }

    if (!type.toLowerCase().includes("payment")) {
      console.log("QuickBooks webhook: ignoring non-payment event type", { type });
      continue;
    }

    try {
      const invoiceIds = await getPaymentLinkedInvoiceIds(entityId);

      for (const invoiceId of invoiceIds) {
        const invoice = await getInvoice(invoiceId);
        if (invoice.balance === 0) {
          await supabase
            .from("engagements")
            .update({ invoice_paid_at: new Date().toISOString() })
            .eq("qb_invoice_id", invoiceId)
            .is("invoice_paid_at", null);
        }
      }
    } catch (err) {
      console.log("QuickBooks webhook: failed to process payment event", {
        entityId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Always ack 200 once past signature verification -- avoids retry storms,
  // same reasoning as the DocuSeal webhook handler.
  return NextResponse.json({ received: true });
}
