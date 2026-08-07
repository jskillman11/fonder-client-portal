"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export type ShellNavItem = {
  href?: string;
  label: string;
  locked?: boolean;
  // Optional section header shown above this item when it differs from the
  // previous item's section -- omit entirely for an ungrouped, flat nav.
  section?: string;
  icon?: LucideIcon;
  // Renders as a collapsible parent (no href of its own) whose children
  // render as indented sub-links -- mirrors the demo's NavMain pattern.
  items?: { href: string; label: string }[];
};

const LOCKED_TITLE = "Unlocks once your documents are sent for signature.";

// Closes the mobile sheet on navigation -- shadcn's SidebarMenuButton has no
// such behavior built in, so nav links stay open after a click on mobile.
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <Link href={href} onClick={() => isMobile && setOpenMobile(false)}>
      {children}
    </Link>
  );
}

// Shown in the header when no sidebarTopSlot (company switcher) is passed --
// e.g. the client portal, which has nothing to switch between. Uses the same
// logo-box-first layout as the switcher so the logo survives icon-collapse
// the same way (the button clips to size-8, leaving the first child visible).
function BrandHeader() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex h-12 items-center gap-2 overflow-hidden rounded-md p-2 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0!">
          <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <span className="text-xs font-semibold">F</span>
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">Fonder</span>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export type ShellSecondaryNavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
};

export function DashboardShell({
  navItems,
  secondaryNavItems,
  sidebarTopSlot,
  breadcrumb,
  headerActions,
  accountSlot,
  children,
}: {
  navItems: ShellNavItem[];
  // Pinned to the bottom of the sidebar's scrollable content, right above
  // accountSlot -- mirrors the shadcn dashboard-01 block's NavSecondary
  // (Settings/Get Help/Search), which uses this exact "own SidebarGroup with
  // mt-auto inside SidebarContent" trick rather than living in SidebarFooter.
  secondaryNavItems?: ShellSecondaryNavItem[];
  sidebarTopSlot?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  headerActions?: React.ReactNode;
  accountSlot: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Consecutive items sharing the same `section` become one SidebarGroup --
  // items with no section at all render as a single, unlabeled group.
  const groups: { section: string | undefined; items: ShellNavItem[] }[] = [];
  for (const item of navItems) {
    const current = groups[groups.length - 1];
    if (current && current.section === item.section) {
      current.items.push(item);
    } else {
      groups.push({ section: item.section, items: [item] });
    }
  }

  return (
    <SidebarProvider>
      <TooltipProvider>
        <Sidebar variant="inset" collapsible="icon">
          <SidebarHeader>{sidebarTopSlot ?? <BrandHeader />}</SidebarHeader>
          <SidebarContent>
            {groups.map((group, i) => (
              <SidebarGroup key={`${group.section ?? "ungrouped"}-${i}`}>
                {group.section && <SidebarGroupLabel>{group.section}</SidebarGroupLabel>}
                <SidebarMenu>
                  {group.items.map((item) => {
                    const Icon = item.icon;

                    if (item.items) {
                      const defaultOpen = item.items.some((sub) => sub.href === pathname);
                      return (
                        <Collapsible key={item.label} defaultOpen={defaultOpen} className="group/collapsible">
                          <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton tooltip={item.label}>
                                {Icon && <Icon />}
                                <span>{item.label}</span>
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {item.items.map((sub) => (
                                  <SidebarMenuSubItem key={sub.href}>
                                    <SidebarMenuSubButton asChild isActive={pathname === sub.href}>
                                      <NavLink href={sub.href}>
                                        <span>{sub.label}</span>
                                      </NavLink>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>
                      );
                    }

                    if (item.locked) {
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton disabled title={LOCKED_TITLE} tooltip={LOCKED_TITLE}>
                            {Icon && <Icon />}
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    }

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild tooltip={item.label}>
                          <NavLink href={item.href ?? "#"}>
                            {Icon && <Icon />}
                            <span>{item.label}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            ))}
            {secondaryNavItems && secondaryNavItems.length > 0 && (
              <SidebarGroup className="mt-auto">
                <SidebarMenu>
                  {secondaryNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild tooltip={item.label}>
                          <NavLink href={item.href}>
                            {Icon && <Icon />}
                            <span>{item.label}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            )}
          </SidebarContent>
          <SidebarFooter>
            <div className="flex justify-end group-data-[collapsible=icon]:justify-center">
              <SidebarTrigger />
            </div>
            {accountSlot}
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-white)] px-4">
            <SidebarTrigger className="-ml-1 md:hidden" />
            {breadcrumb}
            {headerActions && <div className="ml-auto flex items-center gap-2">{headerActions}</div>}
          </header>
          <div className="min-w-0 flex-1 px-4 py-8">{children}</div>
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  );
}
