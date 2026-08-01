"use client";

import { DashboardShell } from "@/components/shell/DashboardShell";
import { useAppUnlock } from "./AppUnlockContext";

const TABS = [
  { href: "", label: "Onboarding" },
  { href: "/home", label: "Home" },
  { href: "/tasks", label: "Tasks" },
  { href: "/resources", label: "Project Resources" },
  { href: "/chat", label: "Chat" },
  { href: "/invoices", label: "Invoices" },
  { href: "/deliverables", label: "Deliverables" },
  { href: "/documents", label: "Signed Documents" },
  { href: "/change-request", label: "Change Request" },
];

export function ClientAppNav({
  clientSlug,
  lockEnabled,
  accountSlot,
  children,
}: {
  clientSlug: string;
  lockEnabled: boolean;
  accountSlot: React.ReactNode;
  children: React.ReactNode;
}) {
  const { docsSent } = useAppUnlock();
  const base = `/portal/${clientSlug}/app`;

  const navItems = TABS.map((tab) => {
    const isOnboarding = tab.href === "";
    return {
      href: `${base}${tab.href}`,
      label: tab.label,
      locked: !isOnboarding && lockEnabled && !docsSent,
    };
  });

  return (
    <DashboardShell navItems={navItems} accountSlot={accountSlot}>
      {children}
    </DashboardShell>
  );
}
