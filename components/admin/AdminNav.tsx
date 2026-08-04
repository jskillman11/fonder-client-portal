"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  House,
  Settings,
  LayoutDashboard,
  LayoutList,
  Users,
  FileText,
  UserCog,
  Globe,
  Receipt,
} from "lucide-react";
import { DashboardShell, type ShellNavItem } from "@/components/shell/DashboardShell";
import { CompanySwitcher } from "@/components/admin/CompanySwitcher";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { Company } from "@/lib/companies-clients";

function computeNavItems(pathname: string, isSuperAdmin: boolean): ShellNavItem[] {
  if (pathname.startsWith("/admin/settings")) {
    return [
      { href: "/admin", label: "← Home", icon: House },
      {
        label: "Settings",
        icon: Settings,
        items: [
          { href: "/admin/settings/team", label: "Team roster" },
          { href: "/admin/settings/content", label: "Portal content" },
          ...(isSuperAdmin ? [{ href: "/admin/settings/staff", label: "Staff accounts" }] : []),
        ],
      },
    ];
  }

  const companyMatch = pathname.match(/^\/admin\/companies\/([^/]+)/);
  if (companyMatch) {
    const companyId = companyMatch[1];
    const base = `/admin/companies/${companyId}`;
    return [
      { href: "/admin/companies", label: "← Companies", icon: Building2 },
      { href: base, label: "Overview", section: "Company", icon: LayoutDashboard },
      { href: `${base}/engagements`, label: "Engagements", section: "Company", icon: LayoutList },
      { href: `${base}/clients`, label: "Clients", section: "Company", icon: Users },
      { href: `${base}/documents`, label: "Documents", section: "Company", icon: FileText },
      { href: `${base}/team`, label: "Team", section: "Company", icon: UserCog },
      { href: `${base}/portal`, label: "Portal", section: "Company", icon: Globe },
      { href: `${base}/billing`, label: "Billing", section: "Company", icon: Receipt },
    ];
  }

  return [
    { href: "/admin", label: "Home", icon: House },
    { href: "/admin/companies", label: "Companies", icon: Building2 },
  ];
}

function computeBreadcrumb(pathname: string, activeCompany: Company | null) {
  if (pathname.startsWith("/admin/settings")) {
    return [{ label: "Home", href: "/admin" }, { label: "Settings" }];
  }
  if (activeCompany) {
    return [
      { label: "Home", href: "/admin" },
      { label: "Companies", href: "/admin/companies" },
      { label: activeCompany.name },
    ];
  }
  if (pathname === "/admin/companies") {
    return [{ label: "Home", href: "/admin" }, { label: "Companies" }];
  }
  return [{ label: "Home" }];
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

  const crumbs = computeBreadcrumb(pathname, activeCompany);

  return (
    <DashboardShell
      navItems={navItems}
      sidebarTopSlot={<CompanySwitcher companies={companies} activeCompany={activeCompany} />}
      breadcrumb={
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((crumb, i) => (
              <React.Fragment key={crumb.label}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {crumb.href ? (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      }
      accountSlot={accountSlot}
    >
      {children}
    </DashboardShell>
  );
}
