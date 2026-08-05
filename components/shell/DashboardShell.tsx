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

export function DashboardShell({
  navItems,
  sidebarTopSlot,
  breadcrumb,
  accountSlot,
  children,
}: {
  navItems: ShellNavItem[];
  sidebarTopSlot?: React.ReactNode;
  breadcrumb?: React.ReactNode;
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
                                      <Link href={sub.href}>
                                        <span>{sub.label}</span>
                                      </Link>
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
                          <Link href={item.href ?? "#"}>
                            {Icon && <Icon />}
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            ))}
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
          </header>
          <div className="flex-1 px-4 py-8">{children}</div>
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  );
}
