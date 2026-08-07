import { redirect } from "next/navigation";

// Workspace Settings is a collapsible nav parent with no page of its own
// (see AdminNav's computeNavItems) -- this bare route only exists for
// anyone hitting it directly (old links/bookmarks, the account menu), and
// lands on the first sub-tab.
export default function WorkspaceSettingsBasePage() {
  redirect("/admin/settings/team");
}
