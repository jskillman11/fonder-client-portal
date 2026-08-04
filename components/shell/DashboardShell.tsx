"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
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
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export type ShellNavItem = {
  href: string;
  label: string;
  locked?: boolean;
  // Optional section header shown above this item when it differs from the
  // previous item's section -- omit entirely for an ungrouped, flat nav.
  section?: string;
  icon?: LucideIcon;
};

const LOCKED_TITLE = "Unlocks once your documents are sent for signature.";

export function DashboardShell({
  navItems,
  sidebarTopSlot,
  accountSlot,
  children,
}: {
  navItems: ShellNavItem[];
  sidebarTopSlot?: React.ReactNode;
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
          <SidebarHeader>
            <div className="flex items-center px-2 py-1.5">
              <Image
                src="/fonder-logo.png"
                alt="Fonder"
                width={112}
                height={26}
                className="h-6 w-auto group-data-[collapsible=icon]:hidden"
              />
            </div>
            {sidebarTopSlot}
          </SidebarHeader>
          <SidebarContent>
            {groups.map((group, i) => (
              <SidebarGroup key={`${group.section ?? "ungrouped"}-${i}`}>
                {group.section && <SidebarGroupLabel>{group.section}</SidebarGroupLabel>}
                <SidebarMenu>
                  {group.items.map((item) => {
                    const Icon = item.icon;

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
                        <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                          <Link href={item.href}>
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
          <SidebarFooter>{accountSlot}</SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center border-b border-[var(--color-border)] bg-[var(--color-white)] px-4">
            <SidebarTrigger />
          </header>
          <div className="flex-1 px-4 py-8">{children}</div>
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  );
}
