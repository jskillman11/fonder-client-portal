import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { getConnectionStatus, getPaymentLinkedInvoiceIds, getInvoice } from "@/lib/quickbooks";

// Receives QuickBooks' webhook notifications. Register this URL
// (https://[your-domain]/api/webhooks/quickbooks) in the Intuit developer
// dashboard's Webhooks tab, subscribed to the Invoice and Payment entities;
// copy the generated "Webhooks Verifier Token" (a credential distinct from
// the OAuth Client Secret) into QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN.
//
// Handles BOTH payload formats -- confirmed by live testing against a real
// webhook delivery, not assumed from docs: Intuit's blog described a
// mandatory CloudEvents migration as already complete, but this app's
// actual deliveries still arrive in the legacy shape:
//   { eventNotifications: [{ realmId, dataChangeEvent: { entities: [{ id, name, operation, lastUpdated }] } }] }
// normalizeEvents() below also understands the newer CloudEvents array
// shape (a JSON array of { type: "qbo.<entity>.<op>.v1", intuitentityid,
// intuitaccountid, ... } envelopes) in case an app ever does have that
// toggle on -- whichever one actually shows up, use it.
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

type NormalizedEvent = { entityName: string; entityId: string; accountId: string };

function normalizeEvents(payload: unknown): NormalizedEvent[] {
  // CloudEvents shape: a JSON array of envelopes.
  if (Array.isArray(payload)) {
    return payload
      .map((event) => {
        const type: string | undefined = event?.type;
        const entityId: string | undefined = event?.intuitentityid;
        const accountId: string | undefined = event?.intuitaccountid;
        if (!type || !entityId || !accountId) return null;
        // Pattern: qbo.<entity-lowercase>.<operation>.v1
        const entityName = type.split(".")[1] ?? type;
        return { entityName, entityId, accountId };
      })
      .filter((e): e is NormalizedEvent => e !== null);
  }

  // Legacy shape -- confirmed live for this app, see comment above.
  const legacy = payload as {
    eventNotifications?: {
      realmId?: string;
      dataChangeEvent?: { entities?: { id?: string; name?: string }[] };
    }[];
  };

  if (Array.isArray(legacy?.eventNotifications)) {
    return legacy.eventNotifications.flatMap((notification) => {
      const accountId = notification.realmId;
      const entities = notification.dataChangeEvent?.entities ?? [];
      return entities
        .map((entity) => {
          if (!accountId || !entity.id || !entity.name) return null;
          return { entityName: entity.name, entityId: entity.id, accountId };
        })
        .filter((e): e is NormalizedEvent => e !== null);
    });
  }

  return [];
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

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.log("QuickBooks webhook: body is not valid JSON");
    return NextResponse.json({ received: true });
  }

  const events = normalizeEvents(payload);
  if (events.length === 0) {
    console.log("QuickBooks webhook: no recognizable events in payload", { payload });
    return NextResponse.json({ received: true });
  }

  const connection = await getConnectionStatus();
  const supabase = createServiceClient();

  for (const event of events) {
    if (connection.realmId && event.accountId !== connection.realmId) {
      console.log("QuickBooks webhook: event for an unrecognized realm, skipping", {
        accountId: event.accountId,
      });
      continue;
    }

    if (!event.entityName.toLowerCase().includes("payment")) {
      console.log("QuickBooks webhook: ignoring non-payment entity", {
        entityName: event.entityName,
      });
      continue;
    }

    try {
      const invoiceIds = await getPaymentLinkedInvoiceIds(event.entityId);

      for (const invoiceId of invoiceIds) {
        const invoice = await getInvoice(invoiceId);
        if (invoice.balance === 0) {
          await supabase
            .from("companies")
            .update({ invoice_paid_at: new Date().toISOString() })
            .eq("qb_invoice_id", invoiceId)
            .is("invoice_paid_at", null);
        }
      }
    } catch (err) {
      console.log("QuickBooks webhook: failed to process payment event", {
        entityId: event.entityId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Always ack 200 once past signature verification -- avoids retry storms,
  // same reasoning as the DocuSeal webhook handler.
  return NextResponse.json({ received: true });
}
