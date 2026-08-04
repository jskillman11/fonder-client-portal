"use client";

import { DashboardShell } from "@/components/shell/DashboardShell";
import { ClientBrandHeader } from "@/components/portal-app/ClientBrandHeader";
import { PORTAL_APP_TABS, isTabLocked, type TabLockState } from "@/lib/portal-app-tabs";

export function ClientAppNav({
  clientSlug,
  companyName,
  companyLogoUrl,
  engagementTitle,
  lockEnabled,
  tabLockOverrides,
  onboardingComplete,
  accountSlot,
  children,
}: {
  clientSlug: string;
  companyName: string;
  companyLogoUrl: string | null;
  engagementTitle?: string | null;
  lockEnabled: boolean;
  tabLockOverrides: Record<string, TabLockState>;
  onboardingComplete: boolean;
  accountSlot: React.ReactNode;
  children: React.ReactNode;
}) {
  const base = `/portal/${clientSlug}/app`;

  const navItems = PORTAL_APP_TABS.map((tab) => ({
    href: `${base}${tab.href}`,
    label: tab.label,
    icon: tab.icon,
    locked: isTabLocked(tab.key, lockEnabled, tabLockOverrides, onboardingComplete),
  }));

  return (
    <DashboardShell
      navItems={navItems}
      sidebarTopSlot={
        <ClientBrandHeader companyName={companyName} companyLogoUrl={companyLogoUrl} engagementTitle={engagementTitle} />
      }
      accountSlot={accountSlot}
    >
      {children}
    </DashboardShell>
  );
}
