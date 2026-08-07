import { notFound } from "next/navigation";
import Link from "next/link";
import { getCompanyBySlug } from "@/lib/companies-clients";
import { getClientVisibleTasks, type ClientTask } from "@/lib/clickup";
import { PlaceholderTab } from "@/components/portal-app/PlaceholderTab";
import { Card } from "@/components/Card";

export const dynamic = "force-dynamic";

function TaskRow({ client, task }: { client: string; task: ClientTask }) {
  return (
    <Link href={`/portal/${client}/app/tasks/${task.id}`}>
      <Card className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[var(--color-cream)]">
        <div>
          <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">{task.name}</p>
          {task.dueDate && (
            <p className="text-[12px] text-[var(--color-muted-text)] mt-0.5">
              Due {new Date(task.dueDate).toLocaleDateString()}
            </p>
          )}
        </div>
        <span
          className="text-[11px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full shrink-0"
          style={{ backgroundColor: `${task.statusColor}22`, color: task.statusColor }}
        >
          {task.status}
        </span>
      </Card>
    </Link>
  );
}

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

  const openTasks = tasks.filter((t) => !t.isClosed);
  const closedTasks = tasks.filter((t) => t.isClosed);

  // Nearest upcoming/overdue first -- tasks with no due date carry no
  // urgency signal, so they sort last rather than first or by insertion order.
  openTasks.sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  // Most recently completed first, so the latest finished work is easiest to find.
  closedTasks.sort((a, b) => {
    if (!a.dateClosed && !b.dateClosed) return 0;
    if (!a.dateClosed) return 1;
    if (!b.dateClosed) return -1;
    return new Date(b.dateClosed).getTime() - new Date(a.dateClosed).getTime();
  });

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {openTasks.length === 0 ? (
        <Card className="px-9 py-14 text-center">
          <p className="text-[14px] text-[var(--color-muted-text)]">No open tasks right now.</p>
        </Card>
      ) : (
        openTasks.map((t) => <TaskRow key={t.id} client={client} task={t} />)
      )}

      {closedTasks.length > 0 && (
        <div className="pt-4">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-muted-text)] mb-3">
            Closed
          </h2>
          <div className="space-y-3">
            {closedTasks.map((t) => (
              <TaskRow key={t.id} client={client} task={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
