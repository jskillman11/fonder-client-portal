"use client";

import { usePathname } from "next/navigation";
import { Building2, Users, FileText, UserCog, LayoutList } from "lucide-react";
import { DashboardShell, type ShellNavItem } from "@/components/shell/DashboardShell";
import { CompanySwitcher } from "@/components/admin/CompanySwitcher";
import type { Company } from "@/lib/companies-clients";

function computeNavItems(pathname: string, isSuperAdmin: boolean): ShellNavItem[] {
  if (pathname.startsWith("/admin/settings")) {
    return [
      { href: "/admin/companies", label: "← All Brands", icon: Building2 },
      { href: "/admin/settings/team", label: "Team", section: "Settings", icon: Users },
      { href: "/admin/settings/content", label: "Portal content", section: "Settings", icon: FileText },
      ...(isSuperAdmin
        ? [{ href: "/admin/settings/staff", label: "Staff", section: "Settings", icon: UserCog }]
        : []),
    ];
  }

  const companyMatch = pathname.match(/^\/admin\/companies\/([^/]+)/);
  if (companyMatch) {
    const companyId = companyMatch[1];
    return [
      { href: "/admin/companies", label: "← All Brands", icon: Building2 },
      { href: `/admin/companies/${companyId}`, label: "Engagements", section: "Company", icon: LayoutList },
    ];
  }

  return [{ href: "/admin/companies", label: "All Brands", icon: Building2 }];
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
