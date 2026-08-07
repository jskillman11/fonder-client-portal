import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/companies-clients";
import { getClientVisibleTasks, type ClientTask } from "@/lib/clickup";
import { PlaceholderTab } from "@/components/portal-app/PlaceholderTab";
import { Card } from "@/components/Card";

export const dynamic = "force-dynamic";

export default async function TasksPage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client } = await params;
  const company = await getCompanyBySlug(client);
  if (!company) notFound();

  if (company.clickupListIds.length === 0) {
    return (
      <PlaceholderTab
        title="Tasks"
        description="Track what's in progress, what's done, and what's coming up next."
      />
    );
  }

  let tasks: ClientTask[] = [];
  let loadFailed = false;
  try {
    tasks = await getClientVisibleTasks(company.clickupListIds);
  } catch {
    // A ClickUp hiccup (bad token, rate limit, etc.) shouldn't break the
    // whole page for a client -- show a plain message instead of throwing
    // into the nearest error boundary.
    loadFailed = true;
  }

  if (loadFailed) {
    return (
      <Card className="px-9 py-14 text-center max-w-2xl mx-auto">
        <p className="text-[14px] text-[var(--color-muted-text)]">
          Couldn&apos;t load tasks right now. Try again shortly.
        </p>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="px-9 py-14 text-center max-w-2xl mx-auto">
        <p className="text-[14px] text-[var(--color-muted-text)]">No tasks to show right now.</p>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {tasks.map((t) => (
        <Card key={t.id} className="px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">{t.name}</p>
            {t.dueDate && (
              <p className="text-[12px] text-[var(--color-muted-text)] mt-0.5">
                Due {new Date(t.dueDate).toLocaleDateString()}
              </p>
            )}
          </div>
          <span
            className="text-[11px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full shrink-0"
            style={{ backgroundColor: `${t.statusColor}22`, color: t.statusColor }}
          >
            {t.status}
          </span>
        </Card>
      ))}
    </div>
  );
}
