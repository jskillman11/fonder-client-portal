import { createServiceClient } from "./supabase/server";
import { PortalCopyKey, PORTAL_COPY_DEFAULTS } from "./portal-copy-constants";

export * from "./portal-copy-constants";

export async function getPortalCopy(): Promise<Record<PortalCopyKey, string>> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("portal_copy").select("content_key, content_value");

  const result = { ...PORTAL_COPY_DEFAULTS };
  for (const row of data ?? []) {
    if (row.content_key in result) {
      (result as Record<string, string>)[row.content_key] = row.content_value;
    }
  }
  return result;
}

export function renderTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}
