import { createServiceClient } from "./supabase/server";

// Single-tenant ClickUp integration -- one Personal API Token for Fonder's
// own shared ClickUp workspace (all clients live as spaces/folders/lists
// inside it), stored as a singleton row in `clickup_connection`, same
// pattern as lib/quickbooks.ts. Clients never get ClickUp access directly --
// this fetches server-side and renders inside the portal's Tasks tab.

const CLICKUP_API_BASE = "https://api.clickup.com/api/v2";

// The signal for "show this task to the client": a custom field named
// "Position" whose selected value is "Client" -- not a tag, not the
// ClickUp assignee (clients have no ClickUp account to be assigned to).
const VISIBILITY_FIELD_NAME = "Position";
const VISIBILITY_FIELD_VALUE = "Client";

export type ClickUpConnectionStatus = {
  connected: boolean;
  connectedByEmail: string | null;
};

export async function getConnectionStatus(): Promise<ClickUpConnectionStatus> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("clickup_connection")
    .select("connected_by_email")
    .eq("id", true)
    .maybeSingle();

  if (!data) return { connected: false, connectedByEmail: null };
  return { connected: true, connectedByEmail: data.connected_by_email };
}

async function getApiToken(): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("clickup_connection").select("api_token").eq("id", true).maybeSingle();
  return data?.api_token ?? null;
}

// Verifies the token actually works (GET /user, the cheapest authenticated
// call ClickUp has) before saving it -- same "test before you trust it"
// bar as every other connector in this app.
export async function saveApiToken(
  apiToken: string,
  connectedByEmail: string,
): Promise<{ success: true } | { error: string }> {
  const res = await fetch(`${CLICKUP_API_BASE}/user`, {
    headers: { Authorization: apiToken },
  });
  if (!res.ok) {
    return { error: res.status === 401 ? "That token was rejected by ClickUp." : `ClickUp returned ${res.status}.` };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("clickup_connection").upsert({
    id: true,
    api_token: apiToken,
    connected_by_email: connectedByEmail,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };
  return { success: true };
}

export async function disconnectClickUp(): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("clickup_connection").delete().eq("id", true);
}

export type ClientTask = {
  id: string;
  name: string;
  status: string;
  statusColor: string;
  dueDate: string | null; // ISO date, or null if unset
  url: string;
};

export type ClientTaskDetail = ClientTask & {
  startDate: string | null; // ISO date, or null if unset
  description: string;
};

type ClickUpFieldOption = {
  id: string;
  // "drop_down" options use `name`, "labels" options use `label` -- both
  // confirmed against real API responses, not assumed from docs alone.
  name?: string;
  label?: string;
  orderindex: number;
};

type ClickUpCustomField = {
  name: string;
  type: string;
  type_config?: { options?: ClickUpFieldOption[] };
  value?: unknown;
};

type ClickUpTask = {
  id: string;
  name: string;
  status: { status: string; color: string };
  due_date: string | null;
  start_date?: string | null;
  description?: string;
  text_content?: string;
  url: string;
  list?: { id: string; name: string };
  custom_fields?: ClickUpCustomField[];
};

// "Position" turned out to be a "labels" field (multi-select), not
// "drop_down" -- confirmed by inspecting a real task response, not assumed.
// Its value is an ARRAY of selected option ids, and its options use `label`
// instead of `name`. Handled alongside "drop_down" (value is a single
// option orderindex) since either could be how this field ends up
// configured, plus a plain string fallback for a simple text field.
function isClientVisible(task: ClickUpTask): boolean {
  const field = task.custom_fields?.find((f) => f.name === VISIBILITY_FIELD_NAME);
  if (!field || field.value === undefined || field.value === null) return false;

  const optionMatches = (option: ClickUpFieldOption) =>
    (option.label ?? option.name) === VISIBILITY_FIELD_VALUE;

  if (field.type === "labels" && Array.isArray(field.value)) {
    const selectedIds = new Set(field.value as string[]);
    return (field.type_config?.options ?? []).some((o) => selectedIds.has(o.id) && optionMatches(o));
  }

  if (field.type === "drop_down" && typeof field.value === "number") {
    const option = field.type_config?.options?.find((o) => o.orderindex === field.value);
    return !!option && optionMatches(option);
  }

  return String(field.value) === VISIBILITY_FIELD_VALUE;
}

async function fetchListTasks(listId: string, apiToken: string): Promise<ClickUpTask[]> {
  const tasks: ClickUpTask[] = [];
  // Bounded, not unbounded -- a client-visible list is never going to be
  // hundreds of pages deep; this just guards against an infinite loop if
  // ClickUp's last_page flag ever misbehaves.
  const MAX_PAGES = 20;

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL(`${CLICKUP_API_BASE}/list/${listId}/task`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("include_closed", "true");
    url.searchParams.set("subtasks", "true");

    const res = await fetch(url, { headers: { Authorization: apiToken } });
    if (!res.ok) {
      throw new Error(`ClickUp returned ${res.status} for list ${listId}`);
    }
    const data = (await res.json()) as { tasks: ClickUpTask[]; last_page: boolean };
    tasks.push(...data.tasks);
    if (data.last_page) break;
  }

  return tasks;
}

// Fetches every task across the given lists and keeps only the ones marked
// client-visible. Internal tasks in the same list are fetched (ClickUp's
// custom-field query filter requires knowing the field/option IDs ahead of
// time, which can differ per list -- filtering here instead is simpler and
// works the same way regardless) but never returned past this function, so
// they never reach the client's browser.
export async function getClientVisibleTasks(listIds: string[]): Promise<ClientTask[]> {
  if (listIds.length === 0) return [];

  const apiToken = await getApiToken();
  if (!apiToken) return [];

  const allTasks = (await Promise.all(listIds.map((id) => fetchListTasks(id, apiToken)))).flat();

  return allTasks
    .filter(isClientVisible)
    .map((t) => ({
      id: t.id,
      name: t.name,
      status: t.status.status,
      statusColor: t.status.color,
      dueDate: t.due_date ? new Date(Number(t.due_date)).toISOString() : null,
      url: t.url,
    }));
}

// Fetches one task's full detail (description, start date -- not returned
// by the list endpoint above) for the client-facing task detail view.
// Returns null for "can't show this" in every case (not found, not one of
// this company's own lists, not marked client-visible) rather than
// distinguishing why -- a client shouldn't be able to tell "wrong ID" apart
// from "that task exists but isn't yours to see" by probing task IDs in the
// URL.
export async function getClientVisibleTask(
  listIds: string[],
  taskId: string,
): Promise<ClientTaskDetail | null> {
  if (listIds.length === 0) return null;

  const apiToken = await getApiToken();
  if (!apiToken) return null;

  const res = await fetch(`${CLICKUP_API_BASE}/task/${taskId}`, {
    headers: { Authorization: apiToken },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`ClickUp returned ${res.status} for task ${taskId}`);
  }

  const task = (await res.json()) as ClickUpTask;

  if (!task.list || !listIds.includes(task.list.id)) return null;
  if (!isClientVisible(task)) return null;

  return {
    id: task.id,
    name: task.name,
    status: task.status.status,
    statusColor: task.status.color,
    dueDate: task.due_date ? new Date(Number(task.due_date)).toISOString() : null,
    startDate: task.start_date ? new Date(Number(task.start_date)).toISOString() : null,
    description: task.description || task.text_content || "",
    url: task.url,
  };
}
