"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

export function ClientAccountMenu({
  clientSlug,
  hasSession,
  isAdmin,
  clientName,
}: {
  clientSlug: string;
  hasSession: boolean;
  isAdmin: boolean;
  clientName: string;
}) {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/portal/sign-out", { method: "POST" });
    router.push(`/portal/${clientSlug}`);
  }

  if (hasSession) {
    return (
      <SidebarMenu>
        <SidebarMenuItem className="flex items-center gap-2 px-2 py-1.5">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarFallback className="rounded-lg">{clientName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-medium">{clientName}</span>
            <button
              onClick={handleSignOut}
              className="truncate text-left text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            >
              Sign out
            </button>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (isAdmin) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Back to admin">
            <a href="/admin">
              <ArrowLeft />
              <span>Back to admin</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return null;
}
