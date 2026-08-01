export type TabLockState = "locked" | "unlocked";

export const PORTAL_APP_TABS = [
  { key: "home", href: "/home", label: "Home" },
  { key: "tasks", href: "/tasks", label: "Tasks" },
  { key: "drive", href: "/drive", label: "Shared Drive" },
  { key: "chat", href: "/chat", label: "Chat" },
  { key: "invoices", href: "/invoices", label: "Invoices" },
  { key: "deliverables", href: "/deliverables", label: "Deliverables" },
  { key: "documents", href: "/documents", label: "Signed Documents" },
  { key: "change-request", href: "/change-request", label: "Change Request" },
] as const;

// Resolves whether a tab should render locked. lockPortalTabs is the
// engagement-level master switch -- off means nothing is ever locked,
// regardless of any per-tab override. When on, a tab follows its own
// override if set ("locked"/"unlocked"), otherwise falls back to the
// docs-signed signal shared across the app (see AppUnlockContext).
export function isTabLocked(
  tabKey: string,
  lockPortalTabs: boolean,
  tabLockOverrides: Record<string, TabLockState>,
  docsSent: boolean,
): boolean {
  if (!lockPortalTabs) return false;
  const override = tabLockOverrides[tabKey];
  if (override === "unlocked") return false;
  if (override === "locked") return true;
  return !docsSent;
}
