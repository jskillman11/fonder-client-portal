import { notFound } from "next/navigation";
import Link from "next/link";
import { getCompanyBySlug } from "@/lib/companies-clients";
import { getClientVisibleTask } from "@/lib/clickup";
import { Card } from "@/components/Card";

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ client: string; taskId: string }>;
}) {
  const { client, taskId } = await params;
  const company = await getCompanyBySlug(client);
  if (!company || company.clickupListIds.length === 0) notFound();

  let task;
  try {
    task = await getClientVisibleTask(company.clickupListIds, taskId);
  } catch {
    // A ClickUp hiccup (bad token, rate limit, etc.) -- distinct from "this
    // task doesn't exist/isn't yours," which is a real 404 below.
    return (
      <Card className="px-9 py-14 text-center max-w-2xl mx-auto">
        <p className="text-[14px] text-[var(--color-muted-text)]">
          Couldn&apos;t load this task right now. Try again shortly.
        </p>
      </Card>
    );
  }
  if (!task) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <Link
        href={`/portal/${client}/app/tasks`}
        className="inline-block text-[13px] text-[var(--color-muted-text)] hover:text-[var(--color-ink)]"
      >
        ← Back to tasks
      </Link>

      <Card className="px-9 py-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-[18px] font-bold text-[var(--color-ink)]">{task.name}</h1>
          <span
            className="text-[11px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full shrink-0"
            style={{ backgroundColor: `${task.statusColor}22`, color: task.statusColor }}
          >
            {task.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-4 mb-5 text-[13px] text-[var(--color-muted-text)]">
          {task.startDate && <p>Starts {new Date(task.startDate).toLocaleDateString()}</p>}
          {task.dueDate && <p>Due {new Date(task.dueDate).toLocaleDateString()}</p>}
        </div>

        {task.description ? (
          <p className="text-[14px] text-[var(--color-ink)] whitespace-pre-wrap leading-relaxed">
            {task.description}
          </p>
        ) : (
          <p className="text-[13px] text-[var(--color-muted-text)]">No description provided.</p>
        )}
      </Card>
    </div>
  );
}
