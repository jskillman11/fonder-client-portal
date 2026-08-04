"use client";

import { useRouter } from "next/navigation";
import { ChevronsUpDown } from "lucide-react";
import type { Company } from "@/lib/companies-clients";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";

export function CompanySwitcher({
  companies,
  activeCompany,
}: {
  companies: Company[];
  activeCompany: Company | null;
}) {
  const router = useRouter();
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {activeCompany?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeCompany.logoUrl}
                    alt={activeCompany.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold">
                    {(activeCompany?.name ?? "Fonder").charAt(0)}
                  </span>
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeCompany?.name ?? "All Brands"}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">Brands</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push("/admin/companies")} className="gap-2 p-2">
              All Brands
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {companies.map((c) => (
              <DropdownMenuItem
                key={c.id}
                onClick={() => router.push(`/admin/companies/${c.id}`)}
                className="gap-2 p-2"
              >
                {c.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
