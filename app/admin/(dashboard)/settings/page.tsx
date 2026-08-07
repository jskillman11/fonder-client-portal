import Link from "next/link";
import { isSuperAdminSession } from "@/lib/supabase/server";
import { Card } from "@/components/Card";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const isSuperAdmin = await isSuperAdminSession();

  return (
    <main className="py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <h1 className="text-[20px] font-bold text-[var(--color-ink)]">Settings</h1>

        <Card className="px-7 py-2">
          <Link
            href="/admin/settings/profile"
            className="block py-3 border-b border-[var(--color-border)] -mx-7 px-7 hover:bg-[var(--color-cream)]"
          >
            <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">Profile</p>
            <p className="text-[13px] text-[var(--color-muted-text)]">Your name and photo</p>
          </Link>
          <Link
            href="/admin/settings/team"
            className="block py-3 border-b border-[var(--color-border)] -mx-7 px-7 hover:bg-[var(--color-cream)]"
          >
            <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">Team</p>
            <p className="text-[13px] text-[var(--color-muted-text)]">
              Account-team roster and staff accounts
            </p>
          </Link>
          <Link
            href="/admin/settings/content"
            className="block py-3 border-b border-[var(--color-border)] -mx-7 px-7 hover:bg-[var(--color-cream)]"
          >
            <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">Portal content</p>
            <p className="text-[13px] text-[var(--color-muted-text)]">
              Site-wide copy shown across every client portal
            </p>
          </Link>
          {isSuperAdmin && (
            <Link
              href="/admin/settings/brand"
              className="block py-3 border-b border-[var(--color-border)] -mx-7 px-7 hover:bg-[var(--color-cream)]"
            >
              <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">Brand</p>
              <p className="text-[13px] text-[var(--color-muted-text)]">
                The Fonder logo shown in the admin sidebar and login page
              </p>
            </Link>
          )}
          {isSuperAdmin && (
            <Link
              href="/admin/settings/connectors"
              className="block py-3 -mx-7 px-7 hover:bg-[var(--color-cream)]"
            >
              <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">Data connectors</p>
              <p className="text-[13px] text-[var(--color-muted-text)]">
                QuickBooks, Google, ClickUp, and Supabase status
              </p>
            </Link>
          )}
        </Card>
      </div>
    </main>
  );
}
