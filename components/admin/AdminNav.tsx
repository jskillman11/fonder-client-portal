"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  House,
  LayoutDashboard,
  Users,
  FileText,
  UserCog,
  Globe,
  Receipt,
  Settings,
  ExternalLink,
  Plug,
  HelpCircle,
  Search,
} from "lucide-react";
import { DashboardShell, type ShellNavItem, type ShellSecondaryNavItem } from "@/components/shell/DashboardShell";
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
      { href: `${base}/clients`, label: "Clients", section: "Company", icon: Users },
      { href: `${base}/documents`, label: "Documents", section: "Company", icon: FileText },
      { href: `${base}/team`, label: "Team", section: "Company", icon: UserCog },
      { href: `${base}/portal`, label: "Portal", section: "Company", icon: Globe },
      { href: `${base}/billing`, label: "Billing", section: "Company", icon: Receipt },
    ];
  }

  // The Fonder (org-level, no company selected) tabs -- Team/Portal content
  // are dissolved out of the old collapsible Settings group now that these
  // ARE the org-level content, not a secondary settings area buried behind a
  // back-link. Settings itself now lives in the secondary nav pinned above
  // the account menu (see buildSecondaryNavItems) rather than duplicated
  // here. Team merges the account-team roster and staff account management
  // (previously "Staff accounts") into one page/tab.
  return [
    { href: "/admin", label: "Overview", icon: House },
    { href: "/admin/settings/team", label: "Team", icon: Users },
    { href: "/admin/settings/content", label: "Portal content", icon: FileText },
    ...(isSuperAdmin
      ? [{ href: "/admin/settings/connectors", label: "Data Connectors", section: "Integrations", icon: Plug }]
      : []),
  ];
}

function buildSecondaryNavItems(): ShellSecondaryNavItem[] {
  return [
    { href: "/admin/settings", label: "Settings", icon: Settings },
    { href: "/admin/help", label: "Get Help", icon: HelpCircle },
    // Placeholder -- no search feature exists yet to wire this up to.
    { href: "#", label: "Search", icon: Search },
  ];
}

// "Fonder" doubles as the way back to the Home dashboard on org-level
// sub-pages (Team, etc.) -- there's no dedicated back-link button anymore,
// so this crumb is the only path back once a switcher click has taken you
// off /admin.
function computeBreadcrumb(pathname: string, activeCompany: Company | null) {
  if (activeCompany) {
    return [{ label: "Fonder", href: "/admin" }, { label: activeCompany.name }];
  }
  if (pathname === "/admin") {
    return [{ label: "Fonder" }];
  }
  const subLabel =
    pathname === "/admin/settings/team"
      ? "Team"
      : pathname === "/admin/settings/content"
        ? "Portal content"
        : pathname === "/admin/settings/connectors"
          ? "Data Connectors"
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
  sidebarLogoUrl,
  accountSlot,
  children,
}: {
  companies: Company[];
  isSuperAdmin: boolean;
  sidebarLogoUrl?: string | null;
  accountSlot: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const navItems = computeNavItems(pathname, isSuperAdmin);

  const companyMatch = pathname.match(/^\/admin\/companies\/([^/]+)/);
  const activeCompany =
    (companyMatch && companies.find((c) => c.id === companyMatch[1])) || null;

  const crumbs = computeBreadcrumb(pathname, activeCompany);
  const portalUrl = activeCompany?.clientSlug ? `/portal/${activeCompany.clientSlug}` : null;

  return (
    <DashboardShell
      navItems={navItems}
      secondaryNavItems={buildSecondaryNavItems()}
      sidebarTopSlot={
        <CompanySwitcher companies={companies} activeCompany={activeCompany} sidebarLogoUrl={sidebarLogoUrl} />
      }
      headerActions={
        portalUrl ? (
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--color-ink)] px-3.5 py-1.5 text-[13px] font-semibold text-white hover:opacity-90"
          >
            <ExternalLink className="size-3.5" />
            Open Portal
          </a>
        ) : null
      }
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
