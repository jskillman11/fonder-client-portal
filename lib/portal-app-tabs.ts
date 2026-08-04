import {
  House,
  ListTodo,
  FolderOpen,
  MessageSquare,
  FileText,
  Receipt,
  Package,
  PencilLine,
} from "lucide-react";

export type TabLockState = "locked" | "unlocked";

export const PORTAL_APP_TABS = [
  { key: "home", href: "/home", label: "Home", icon: House },
  { key: "tasks", href: "/tasks", label: "Tasks", icon: ListTodo },
  { key: "drive", href: "/drive", label: "Shared Drive", icon: FolderOpen },
  { key: "chat", href: "/chat", label: "Chat", icon: MessageSquare },
  { key: "documents", href: "/documents", label: "Documents", icon: FileText },
  { key: "invoices", href: "/invoices", label: "Invoices", icon: Receipt },
  { key: "deliverables", href: "/deliverables", label: "Deliverables", icon: Package },
  { key: "change-request", href: "/change-request", label: "Change Request", icon: PencilLine },
] as const;

// Resolves whether a tab should render locked. lockPortalTabs is the
// engagement-level master switch -- off means nothing is ever locked,
// regardless of any per-tab override. When on, a tab follows its own
// override if set ("locked"/"unlocked"), otherwise falls back to the
// docs-signed signal shared across the app (see AppUnlockContext).
//
// "home" is a hard exception, not subject to lockPortalTabs or any
// override: onboarding lives there, and onboarding is what unlocks
// everything else -- locking it would leave a client with no way in.
export function isTabLocked(
  tabKey: string,
  lockPortalTabs: boolean,
  tabLockOverrides: Record<string, TabLockState>,
  docsSent: boolean,
): boolean {
  if (tabKey === "home") return false;
  if (!lockPortalTabs) return false;
  const override = tabLockOverrides[tabKey];
  if (override === "unlocked") return false;
  if (override === "locked") return true;
  return !docsSent;
}
