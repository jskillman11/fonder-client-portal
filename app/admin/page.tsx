import Link from "next/link";
import { listEngagements } from "@/lib/get-engagement";
import { Card } from "@/components/Card";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const engagements = await listEngagements();

  return (
    <main className="min-h-screen bg-[var(--color-cream)] py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-bold text-[var(--color-ink)]">
            Clients
          </h1>
          <Link
            href="/admin/new-client"
            className="rounded-[var(--radius-pill)] bg-[var(--color-ink)] text-white text-[13px] font-semibold px-5 py-2.5"
          >
            + New client
          </Link>
        </div>

        {engagements.length === 0 && (
          <Card className="px-9 py-9 text-center">
            <p className="text-[14px] text-[var(--color-muted)]">
              No clients yet — create the first one.
            </p>
          </Card>
        )}

        {engagements.map((e) => (
          <Card
            key={e.clientSlug}
            className="px-7 py-5 flex items-center justify-between"
          >
            <div>
              <p className="text-[15px] font-semibold text-[var(--color-ink)]">
                {e.clientName}
              </p>
              <p className="text-[13px] text-[var(--color-muted)]">
                {e.engagementTitle}
              </p>
            </div>
            <div className="flex gap-4 items-center text-[13px]">
              <Link
                href={`/portal/${e.clientSlug}`}
                target="_blank"
                className="text-[var(--color-muted)] underline"
              >
                View portal
              </Link>
              <Link
                href={`/admin/edit/${e.clientSlug}`}
                className="font-medium text-[var(--color-ink)] underline"
              >
                Edit
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
