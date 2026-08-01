import Link from "next/link";
import { listEngagements } from "@/lib/get-engagement";
import { Card } from "@/components/Card";
import { BackButton } from "@/components/admin/BackButton";
import { EngagementRow } from "@/components/admin/EngagementRow";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const engagements = await listEngagements();

  return (
    <main className="py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <BackButton />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-[20px] font-bold text-[var(--color-ink)]">
            Engagements
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/companies"
              className="rounded-[var(--radius-pill)] border border-[var(--color-border)] text-[var(--color-ink)] text-[13px] font-semibold px-5 py-2.5"
            >
              Companies
            </Link>
            <Link
              href="/admin/clients"
              className="rounded-[var(--radius-pill)] border border-[var(--color-border)] text-[var(--color-ink)] text-[13px] font-semibold px-5 py-2.5"
            >
              Clients
            </Link>
            <Link
              href="/admin/content"
              className="rounded-[var(--radius-pill)] border border-[var(--color-border)] text-[var(--color-ink)] text-[13px] font-semibold px-5 py-2.5"
            >
              Portal content
            </Link>
            <Link
              href="/admin/new-client"
              className="rounded-[var(--radius-pill)] bg-[var(--color-ink)] text-white text-[13px] font-semibold px-5 py-2.5"
            >
              + New client
            </Link>
          </div>
        </div>

        {engagements.length === 0 && (
          <Card className="px-9 py-9 text-center">
            <p className="text-[14px] text-[var(--color-muted)]">
              No engagements yet — create the first one.
            </p>
          </Card>
        )}

        {engagements.map((e) => (
          <EngagementRow
            key={e.clientSlug}
            clientSlug={e.clientSlug}
            clientName={e.clientName}
            engagementTitle={e.engagementTitle}
          />
        ))}
      </div>
    </main>
  );
}
