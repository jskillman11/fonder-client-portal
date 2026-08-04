"use client";

import { useRouter } from "next/navigation";
import { ChevronsUpDown } from "lucide-react";
import type { Company } from "@/lib/companies-clients";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
              <Avatar className="h-8 w-8 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {activeCompany?.logoUrl && (
                  <AvatarImage src={activeCompany.logoUrl} alt={activeCompany.name} className="object-cover" />
                )}
                <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  {(activeCompany?.name ?? "Fonder").charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeCompany?.name ?? "Fonder"}</span>
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
              Manage brands
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
