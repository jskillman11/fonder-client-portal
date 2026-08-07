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

type ClickUpCustomField = {
  name: string;
  type: string;
  type_config?: { options?: { id: string; name: string; orderindex: number }[] };
  value?: unknown;
};

type ClickUpTask = {
  id: string;
  name: string;
  status: { status: string; color: string };
  due_date: string | null;
  url: string;
  custom_fields?: ClickUpCustomField[];
};

// Dropdown fields store `value` as the selected option's orderindex (a
// number), not its name or id -- resolved by looking that index up against
// the field's own type_config.options. Non-dropdown field types (in case
// "Position" is ever set up as plain text) fall back to a direct string
// comparison.
function isClientVisible(task: ClickUpTask): boolean {
  const field = task.custom_fields?.find((f) => f.name === VISIBILITY_FIELD_NAME);
  if (!field || field.value === undefined || field.value === null) return false;

  if (field.type === "drop_down") {
    const option = field.type_config?.options?.find((o) => o.orderindex === field.value);
    return option?.name === VISIBILITY_FIELD_VALUE;
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
