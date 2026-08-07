import Link from "next/link";
import { isSuperAdminSession } from "@/lib/supabase/server";
import { getConnectionStatus } from "@/lib/quickbooks";
import { getConnectionStatus as getClickUpConnectionStatus } from "@/lib/clickup";
import { listCompanies } from "@/lib/companies-clients";
import { Card } from "@/components/Card";
import { QuickBooksDisconnectButton } from "@/components/admin/QuickBooksDisconnectButton";
import { ClickUpConnectionForm } from "@/components/admin/ClickUpConnectionForm";

export const dynamic = "force-dynamic";

export default async function DataConnectorsPage() {
  const isSuperAdmin = await isSuperAdminSession();

  if (!isSuperAdmin) {
    return (
      <main className="py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-5">
          <Card className="px-9 py-9 text-center">
            <p className="text-[14px] text-[var(--color-muted-text)]">
              Only super-admins can manage data connectors.
            </p>
          </Card>
        </div>
      </main>
    );
  }

  const [qb, clickup, companies] = await Promise.all([
    getConnectionStatus(),
    getClickUpConnectionStatus(),
    listCompanies(),
  ]);
  const clickupCount = companies.filter((c) => c.clickupListIds.length > 0).length;
  const sheetsCount = companies.filter((c) => c.googleSheetIds.length > 0).length;

  return (
    <main className="py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <h1 className="text-[20px] font-bold text-[var(--color-ink)]">Data connectors</h1>
        <p className="text-[13px] text-[var(--color-muted-text)]">
          Everything the portal currently connects to, and how it&apos;s configured.
        </p>

        <Card className="px-9 py-8">
          <h2 className="text-[15px] font-bold text-[var(--color-ink)] mb-1">QuickBooks</h2>
          {qb.connected ? (
            <>
              <p className="text-[13px] text-[var(--color-muted-text)]">
                Connected &middot; {qb.environment} &middot; company (realm) ID {qb.realmId}
              </p>
              {qb.connectedByEmail && (
                <p className="text-[13px] text-[var(--color-muted-text)] mb-4">
                  Connected by {qb.connectedByEmail}
                </p>
              )}
              <div className="mt-4">
                <QuickBooksDisconnectButton />
              </div>
            </>
          ) : (
            <>
              <p className="text-[13px] text-[var(--color-muted-text)] mb-4">
                Not connected. Connect Fonder&apos;s QuickBooks company to create and track real
                invoices for client engagements.
              </p>
              <a
                href="/api/admin/quickbooks/connect"
                className="inline-flex items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-ink)] text-white px-6 py-3 text-[13.5px] font-semibold hover:opacity-90"
              >
                Connect QuickBooks
              </a>
            </>
          )}
        </Card>

        <Card className="px-9 py-8">
          <h2 className="text-[15px] font-bold text-[var(--color-ink)] mb-1">Google</h2>
          <p className="text-[13px] text-[var(--color-muted-text)]">
            Staff sign in via Google Workspace SSO. {sheetsCount} of {companies.length} companies
            have a Google Sheet linked.
          </p>
        </Card>

        <Card className="px-9 py-8">
          <h2 className="text-[15px] font-bold text-[var(--color-ink)] mb-1">ClickUp</h2>
          <ClickUpConnectionForm connected={clickup.connected} connectedByEmail={clickup.connectedByEmail} />
          <p className="text-[13px] text-[var(--color-muted-text)] mt-4 pt-4 border-t border-[var(--color-border)]">
            {clickupCount} of {companies.length} companies have a ClickUp list linked.{" "}
            <Link href="/admin/companies" className="underline text-[var(--color-ink)]">
              Manage per company
            </Link>
          </p>
        </Card>

        <Card className="px-9 py-8">
          <h2 className="text-[15px] font-bold text-[var(--color-ink)] mb-1">Supabase</h2>
          <p className="text-[13px] text-[var(--color-muted-text)]">
            This app&apos;s own database, auth, and storage provider.
          </p>
          <p className="text-[12px] font-mono text-[var(--color-muted-text)] mt-1">
            {process.env.NEXT_PUBLIC_SUPABASE_URL}
          </p>
        </Card>
      </div>
    </main>
  );
}
