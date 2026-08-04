"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { House, LayoutDashboard, LayoutList, Users, FileText, UserCog, Globe, Receipt } from "lucide-react";
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
  const companyMatch = pathname.match(/^\/admin\/companies\/([^/]+)/);
  if (companyMatch) {
    const companyId = companyMatch[1];
    const base = `/admin/companies/${companyId}`;
    return [
      { href: base, label: "Overview", section: "Company", icon: LayoutDashboard },
      { href: `${base}/engagements`, label: "Engagements", section: "Company", icon: LayoutList },
      { href: `${base}/clients`, label: "Clients", section: "Company", icon: Users },
      { href: `${base}/documents`, label: "Documents", section: "Company", icon: FileText },
      { href: `${base}/team`, label: "Team", section: "Company", icon: UserCog },
      { href: `${base}/portal`, label: "Portal", section: "Company", icon: Globe },
      { href: `${base}/billing`, label: "Billing", section: "Company", icon: Receipt },
    ];
  }

  // The Fonder (org-level, no company selected) tabs -- Team roster/Portal
  // content/Staff accounts are dissolved out of the old collapsible Settings
  // group now that these ARE the org-level content, not a secondary settings
  // area buried behind a back-link.
  return [
    { href: "/admin", label: "Overview", icon: House },
    { href: "/admin/settings/team", label: "Team roster", icon: Users },
    { href: "/admin/settings/content", label: "Portal content", icon: FileText },
    ...(isSuperAdmin ? [{ href: "/admin/settings/staff", label: "Staff accounts", icon: UserCog }] : []),
  ];
}

// "Fonder" doubles as the way back to the Home dashboard on org-level
// sub-pages (Team roster, etc.) -- there's no dedicated back-link button
// anymore, so this crumb is the only path back once a switcher click has
// taken you off /admin.
function computeBreadcrumb(pathname: string, activeCompany: Company | null) {
  if (activeCompany) {
    return [{ label: "Fonder", href: "/admin" }, { label: activeCompany.name }];
  }
  if (pathname === "/admin") {
    return [{ label: "Fonder" }];
  }
  const subLabel =
    pathname === "/admin/settings/team"
      ? "Team roster"
      : pathname === "/admin/settings/content"
        ? "Portal content"
        : pathname === "/admin/settings/staff"
          ? "Staff accounts"
          : pathname === "/admin/settings/profile"
            ? "Profile"
            : pathname.startsWith("/admin/settings")
              ? "Settings"
              : null;
  return subLabel ? [{ label: "Fonder", href: "/admin" }, { label: subLabel }] : [{ label: "Fonder" }];
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
