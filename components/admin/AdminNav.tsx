"use client";

import { usePathname } from "next/navigation";
import { DashboardShell, type ShellNavItem } from "@/components/shell/DashboardShell";
import { CompanySwitcher } from "@/components/admin/CompanySwitcher";
import type { Company } from "@/lib/companies-clients";

function computeNavItems(pathname: string, isSuperAdmin: boolean): ShellNavItem[] {
  const engagementMatch = pathname.match(/^\/admin\/companies\/([^/]+)\/engagements\/([^/]+)/);
  if (engagementMatch && engagementMatch[2] !== "new") {
    const [, companyId, slug] = engagementMatch;
    const base = `/admin/companies/${companyId}/engagements/${slug}`;
    return [
      { href: `/admin/companies/${companyId}`, label: "← Engagements" },
      { href: base, label: "Overview", section: "Engagement" },
      { href: `${base}/team`, label: "Team", section: "Engagement" },
      { href: `${base}/documents`, label: "Documents", section: "Engagement" },
      { href: `${base}/portal-content`, label: "Portal content & locks", section: "Engagement" },
      { href: `${base}/shared-drive`, label: "Shared Drive", section: "Engagement" },
      { href: `${base}/payments`, label: "Payments", section: "Engagement" },
    ];
  }

  if (pathname.startsWith("/admin/settings")) {
    return [
      { href: "/admin/companies", label: "← All Clients" },
      { href: "/admin/settings/team", label: "Team", section: "Settings" },
      { href: "/admin/settings/content", label: "Portal content", section: "Settings" },
      ...(isSuperAdmin
        ? [{ href: "/admin/settings/staff", label: "Staff", section: "Settings" }]
        : []),
    ];
  }

  const companyMatch = pathname.match(/^\/admin\/companies\/([^/]+)/);
  if (companyMatch) {
    const companyId = companyMatch[1];
    return [
      { href: "/admin/companies", label: "← All Clients" },
      { href: `/admin/companies/${companyId}`, label: "Engagements", section: "Company" },
    ];
  }

  return [{ href: "/admin/companies", label: "All Clients" }];
}

export function AdminNav({
  companies,
  isSuperAdmin,
  accountSlot,
  children,
}: {
  companies: Company[];
  isSuperAdmin: boolean;
  accountSlot: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const navItems = computeNavItems(pathname, isSuperAdmin);

  const companyMatch = pathname.match(/^\/admin\/companies\/([^/]+)/);
  const activeCompany =
    (companyMatch && companies.find((c) => c.id === companyMatch[1])) || null;

  return (
    <DashboardShell
      navItems={navItems}
      sidebarTopSlot={<CompanySwitcher companies={companies} activeCompany={activeCompany} />}
      accountSlot={accountSlot}
    >
      {children}
    </DashboardShell>
  );
}
