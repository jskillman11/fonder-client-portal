import { isSuperAdminSession } from "@/lib/supabase/server";
import { getConnectionStatus } from "@/lib/quickbooks";
import { Card } from "@/components/Card";
import { BackButton } from "@/components/admin/BackButton";
import { QuickBooksDisconnectButton } from "@/components/admin/QuickBooksDisconnectButton";

export const dynamic = "force-dynamic";

export default async function QuickBooksSettingsPage() {
  const isSuperAdmin = await isSuperAdminSession();

  if (!isSuperAdmin) {
    return (
      <main className="py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-5">
          <BackButton />
          <Card className="px-9 py-9 text-center">
            <p className="text-[14px] text-[var(--color-muted-text)]">
              Only super-admins can manage the QuickBooks connection.
            </p>
          </Card>
        </div>
      </main>
    );
  }

  const status = await getConnectionStatus();

  return (
    <main className="py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <BackButton />
        <h1 className="text-[20px] font-bold text-[var(--color-ink)]">QuickBooks</h1>

        <Card className="px-9 py-9">
          {status.connected ? (
            <>
              <p className="text-[14.5px] font-semibold text-[var(--color-ink)] mb-1">
                Connected
              </p>
              <p className="text-[13px] text-[var(--color-muted-text)]">
                Environment: {status.environment}
              </p>
              <p className="text-[13px] text-[var(--color-muted-text)]">
                Company (realm) ID: {status.realmId}
              </p>
              {status.connectedByEmail && (
                <p className="text-[13px] text-[var(--color-muted-text)] mb-4">
                  Connected by {status.connectedByEmail}
                </p>
              )}
              <div className="mt-4">
                <QuickBooksDisconnectButton />
              </div>
            </>
          ) : (
            <>
              <p className="text-[14px] text-[var(--color-muted-text)] mb-4">
                Connect Fonder&apos;s QuickBooks company to enable creating and tracking real
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
      </div>
    </main>
  );
}
