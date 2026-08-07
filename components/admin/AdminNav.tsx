"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  House,
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  Settings,
  ExternalLink,
  ChevronDown,
  Copy,
  Send,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      { href: `${base}/billing`, label: "Billing", section: "Company", icon: Receipt },
      { href: `${base}/settings`, label: "Brand Settings", section: "Company", icon: Settings },
      { href: `${base}/connectors`, label: "Data Connectors", section: "Integrations", icon: Plug },
    ];
  }

  // The Fonder (org-level, no company selected) tabs. Workspace Settings
  // folds in what used to be separate Team/Portal content tabs -- mirrors
  // how each company's own Brand Settings tab folds in its Team/Portal
  // tabs, so "Settings" means the same thing (this level's settings) at
  // both scopes. The secondary nav's old Settings link (see
  // buildSecondaryNavItems) moved into the account menu instead, since it's
  // now redundant with this tab.
  return [
    { href: "/admin", label: "Overview", icon: House },
    { href: "/admin/settings", label: "Workspace Settings", icon: Settings },
    ...(isSuperAdmin
      ? [{ href: "/admin/settings/connectors", label: "Data Connectors", section: "Integrations", icon: Plug }]
      : []),
  ];
}

function buildSecondaryNavItems(): ShellSecondaryNavItem[] {
  return [
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
    pathname === "/admin/settings/connectors"
      ? "Data Connectors"
      : pathname === "/admin/settings/profile"
        ? "Profile"
        : pathname.startsWith("/admin/settings")
          ? "Workspace Settings"
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
  const [sendingAccessLink, setSendingAccessLink] = useState(false);

  async function handleCopyPortalUrl() {
    if (!portalUrl) return;
    await navigator.clipboard.writeText(`${window.location.origin}${portalUrl}`);
    toast.success("Portal link copied.");
  }

  async function handleSendAccessLink() {
    if (!activeCompany?.clientSlug) return;
    setSendingAccessLink(true);

    const res = await fetch("/api/admin/send-portal-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientSlug: activeCompany.clientSlug }),
    });
    const data = await res.json();
    setSendingAccessLink(false);

    if (!res.ok) {
      toast.error(data.error ?? "Failed to send access link.");
      return;
    }
    toast.success("Access link sent.");
  }

  return (
    <DashboardShell
      navItems={navItems}
      secondaryNavItems={buildSecondaryNavItems()}
      sidebarTopSlot={
        <CompanySwitcher companies={companies} activeCompany={activeCompany} sidebarLogoUrl={sidebarLogoUrl} />
      }
      headerActions={
        portalUrl ? (
          <div className="inline-flex items-center rounded-[var(--radius-pill)] bg-[var(--color-ink)] text-white">
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-l-[var(--radius-pill)] py-1.5 pl-3.5 pr-2.5 text-[13px] font-semibold hover:opacity-90"
            >
              <ExternalLink className="size-3.5" />
              Open Portal
            </a>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  title="More portal actions"
                  className="inline-flex items-center justify-center rounded-r-[var(--radius-pill)] border-l border-white/20 px-2 py-1.5 hover:opacity-90"
                >
                  <ChevronDown className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopyPortalUrl} className="gap-2">
                  <Copy className="size-3.5" />
                  Copy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSendAccessLink} disabled={sendingAccessLink} className="gap-2">
                  <Send className="size-3.5" />
                  {sendingAccessLink ? "Sending…" : "Send link"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
