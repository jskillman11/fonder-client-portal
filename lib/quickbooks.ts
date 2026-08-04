import { createServiceClient } from "./supabase/server";

// Single-tenant QuickBooks Online integration -- there is exactly one
// connection for the whole app (Fonder's own QuickBooks company), stored
// as a singleton row in `quickbooks_connection` (see supabase-setup.sql).
// This is NOT a per-client-company setting, so it doesn't fit
// lib/company-settings.ts's pattern -- it needs its own OAuth token-refresh
// logic instead of a plain column read/write.

const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const MINOR_VERSION = "65"; // current default; >=36 required for include=invoiceLink

function baseUrlFor(environment: string): string {
  return environment === "production"
    ? "https://quickbooks.api.intuit.com"
    : "https://sandbox-quickbooks.api.intuit.com";
}

export type QuickBooksConnectionStatus = {
  connected: boolean;
  environment: "sandbox" | "production" | null;
  realmId: string | null;
  connectedByEmail: string | null;
};

export async function getConnectionStatus(): Promise<QuickBooksConnectionStatus> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("quickbooks_connection")
    .select("environment, realm_id, connected_by_email")
    .eq("id", true)
    .maybeSingle();

  if (!data) {
    return { connected: false, environment: null, realmId: null, connectedByEmail: null };
  }
  return {
    connected: true,
    environment: data.environment,
    realmId: data.realm_id,
    connectedByEmail: data.connected_by_email,
  };
}

export async function saveConnectionFromOAuthCallback({
  realmId,
  accessToken,
  refreshToken,
  expiresIn,
  refreshTokenExpiresIn,
  connectedByEmail,
}: {
  realmId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshTokenExpiresIn: number;
  connectedByEmail: string;
}): Promise<void> {
  const supabase = createServiceClient();
  const now = Date.now();
  await supabase.from("quickbooks_connection").upsert({
    id: true,
    environment: process.env.QUICKBOOKS_ENVIRONMENT === "production" ? "production" : "sandbox",
    realm_id: realmId,
    access_token: accessToken,
    refresh_token: refreshToken,
    access_token_expires_at: new Date(now + expiresIn * 1000).toISOString(),
    refresh_token_expires_at: new Date(now + refreshTokenExpiresIn * 1000).toISOString(),
    connected_by_email: connectedByEmail,
    updated_at: new Date().toISOString(),
  });
}

export async function disconnectQuickBooks(): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("quickbooks_connection").delete().eq("id", true);
}

// Returns a valid access token, transparently refreshing it if it's within
// 5 minutes of expiring. Critical: QuickBooks ROTATES the refresh_token
// value itself on every refresh call (even though the ~100-day validity
// window doesn't reset) -- so the newest refresh_token must always be
// persisted, or the next refresh will fail.
async function getValidAccessToken(): Promise<{ accessToken: string; realmId: string; baseUrl: string }> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("quickbooks_connection")
    .select("*")
    .eq("id", true)
    .maybeSingle();

  if (!data) {
    throw new Error("QuickBooks is not connected");
  }

  const baseUrl = baseUrlFor(data.environment);
  const expiresAt = new Date(data.access_token_expires_at).getTime();
  const fiveMinutes = 5 * 60 * 1000;

  if (expiresAt - Date.now() > fiveMinutes) {
    return { accessToken: data.access_token, realmId: data.realm_id, baseUrl };
  }

  const clientId = process.env.QUICKBOOKS_CLIENT_ID!;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET!;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: data.refresh_token,
    }),
  });

  if (!res.ok) {
    throw new Error(`QuickBooks token refresh failed: ${res.status} ${await res.text()}`);
  }

  const tokens = await res.json();
  const now = Date.now();

  await supabase
    .from("quickbooks_connection")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      access_token_expires_at: new Date(now + tokens.expires_in * 1000).toISOString(),
      refresh_token_expires_at: new Date(now + tokens.x_refresh_token_expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  return { accessToken: tokens.access_token, realmId: data.realm_id, baseUrl };
}

type QuickBooksCustomer = {
  Id: string;
  SyncToken: string;
  DisplayName: string;
  PrimaryEmailAddr?: { Address: string };
};
type QuickBooksInvoice = { Id: string; Balance: number; TotalAmt: number; InvoiceLink?: string };
type QuickBooksLinkedTxn = { TxnId: string; TxnType: string };
type QuickBooksPaymentLine = { LinkedTxn?: QuickBooksLinkedTxn[] };
type QuickBooksPayment = { Id: string; Line?: QuickBooksPaymentLine[] };

async function qboFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { accessToken, realmId, baseUrl } = await getValidAccessToken();

  const res = await fetch(`${baseUrl}/v3/company/${realmId}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`QuickBooks API error ${res.status}: ${await res.text()}`);
  }

  return res.json() as Promise<T>;
}

// Looks up a QuickBooks Customer by DisplayName (our companies.name, which
// is already unique), creating one if it doesn't exist yet. An Invoice's
// CustomerRef must point at a pre-existing Customer -- there's no
// create-on-the-fly at invoice-creation time.
//
// email is required for QuickBooks to generate a hosted InvoiceLink later --
// confirmed by live testing against the sandbox: InvoiceLink stays null
// regardless of minorversion/include unless the invoice itself has BillEmail
// set (see createInvoice below), and having a real customer email on file is
// part of that. An existing customer missing an email gets patched here too,
// so companies created before this was in place self-heal on next use.
export async function findOrCreateCustomer(displayName: string, email: string): Promise<string> {
  const escaped = displayName.replace(/'/g, "\\'");
  const query = `SELECT * FROM Customer WHERE DisplayName = '${escaped}'`;
  const result = await qboFetch<{ QueryResponse?: { Customer?: QuickBooksCustomer[] } }>(
    `/query?query=${encodeURIComponent(query)}&minorversion=${MINOR_VERSION}`,
  );

  const existing = result.QueryResponse?.Customer?.[0];
  if (existing) {
    if (!existing.PrimaryEmailAddr?.Address && email) {
      await qboFetch(`/customer?minorversion=${MINOR_VERSION}`, {
        method: "POST",
        body: JSON.stringify({
          Id: existing.Id,
          SyncToken: existing.SyncToken,
          sparse: true,
          PrimaryEmailAddr: { Address: email },
        }),
      });
    }
    return existing.Id;
  }

  const created = await qboFetch<{ Customer: QuickBooksCustomer }>(
    `/customer?minorversion=${MINOR_VERSION}`,
    {
      method: "POST",
      body: JSON.stringify({
        DisplayName: displayName,
        PrimaryEmailAddr: { Address: email },
      }),
    },
  );

  return created.Customer.Id;
}

export async function createInvoice({
  customerId,
  amount,
  description,
  billEmail,
}: {
  customerId: string;
  amount: number;
  description: string;
  billEmail: string;
}): Promise<{ invoiceId: string; invoiceLink: string | null; totalAmt: number }> {
  const itemId = process.env.QUICKBOOKS_ITEM_ID;
  if (!itemId) {
    throw new Error("QUICKBOOKS_ITEM_ID is not configured");
  }

  // BillEmail on the invoice itself is what actually makes QuickBooks
  // generate a hosted InvoiceLink (confirmed via live sandbox testing --
  // customer-level email alone was NOT sufficient). Setting it does not
  // trigger an email send by itself -- QuickBooks only emails on an explicit
  // call to its /send endpoint, which this app deliberately never calls
  // (portal-only invoice delivery, per design).
  const created = await qboFetch<{ Invoice: QuickBooksInvoice }>(
    `/invoice?include=invoiceLink&minorversion=${MINOR_VERSION}`,
    {
      method: "POST",
      body: JSON.stringify({
        CustomerRef: { value: customerId },
        BillEmail: { Address: billEmail },
        Line: [
          {
            Amount: amount,
            DetailType: "SalesItemLineDetail",
            Description: description,
            SalesItemLineDetail: { ItemRef: { value: itemId } },
          },
        ],
      }),
    },
  );

  const invoice = created.Invoice;
  return {
    invoiceId: invoice.Id,
    invoiceLink: toWorkingInvoiceLink(invoice.InvoiceLink),
    totalAmt: invoice.TotalAmt,
  };
}

// QuickBooks' InvoiceLink field comes back pointing at
// developer.intuit.com/comingSoonview/{hash}, which 404s -- confirmed via
// live testing that swapping in connect.intuit.com/t/{hash} (same hash,
// same query string) is the actual working hosted invoice page, in both
// sandbox and (per community reports) production.
function toWorkingInvoiceLink(rawLink: string | undefined): string | null {
  if (!rawLink) return null;
  return rawLink.replace(
    "https://developer.intuit.com/comingSoonview/",
    "https://connect.intuit.com/t/",
  );
}

export async function getInvoice(id: string): Promise<{ id: string; balance: number; totalAmt: number }> {
  const result = await qboFetch<{ Invoice: QuickBooksInvoice }>(
    `/invoice/${id}?minorversion=${MINOR_VERSION}`,
  );
  return { id: result.Invoice.Id, balance: result.Invoice.Balance, totalAmt: result.Invoice.TotalAmt };
}

// Payment.Line[].LinkedTxn[] links a payment back to the invoice(s) it was
// applied to -- a much stronger signal that "money actually moved" than a
// generic Invoice-changed webhook event.
export async function getPaymentLinkedInvoiceIds(paymentId: string): Promise<string[]> {
  const result = await qboFetch<{ Payment: QuickBooksPayment }>(
    `/payment/${paymentId}?minorversion=${MINOR_VERSION}`,
  );
  const payment = result.Payment;
  const invoiceIds: string[] = [];

  for (const line of payment.Line ?? []) {
    for (const txn of line.LinkedTxn ?? []) {
      if (txn.TxnType === "Invoice") invoiceIds.push(txn.TxnId);
    }
  }

  return invoiceIds;
}
