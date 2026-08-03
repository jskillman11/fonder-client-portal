"use client";

import { DashboardShell } from "@/components/shell/DashboardShell";
import { PORTAL_APP_TABS, isTabLocked, type TabLockState } from "@/lib/portal-app-tabs";

export function ClientAppNav({
  clientSlug,
  lockEnabled,
  tabLockOverrides,
  docsSigned,
  accountSlot,
  children,
}: {
  clientSlug: string;
  lockEnabled: boolean;
  tabLockOverrides: Record<string, TabLockState>;
  docsSigned: boolean;
  accountSlot: React.ReactNode;
  children: React.ReactNode;
}) {
  const base = `/portal/${clientSlug}/app`;

  const navItems = [
    { href: base, label: "Onboarding" },
    ...PORTAL_APP_TABS.map((tab) => ({
      href: `${base}${tab.href}`,
      label: tab.label,
      locked: isTabLocked(tab.key, lockEnabled, tabLockOverrides, docsSigned),
    })),
  ];

  return (
    <DashboardShell navItems={navItems} accountSlot={accountSlot}>
      {children}
    </DashboardShell>
  );
}
