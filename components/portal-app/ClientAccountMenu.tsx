"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronsUpDown, UserCircle, Settings, HelpCircle, LogOut, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { AdminAccountMenu } from "@/components/admin/AdminAccountMenu";
import { initialsFromName } from "@/lib/initials";

// Shared by the real client session AND a staff member's "View as client"
// preview -- same menu either way, just a different sign-out behavior and
// an extra "Back to admin account" item when previewing.
function ClientStyleMenu({
  base,
  name,
  email,
  jobTitle,
  avatarUrl,
  onSignOut,
  backToAdmin,
}: {
  base: string;
  name: string;
  email?: string;
  jobTitle?: string | null;
  avatarUrl?: string | null;
  onSignOut: () => void;
  backToAdmin?: () => void;
}) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="h-auto py-2 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg after:rounded-lg">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={name} className="rounded-lg object-cover" />}
                <AvatarFallback className="rounded-lg">{initialsFromName(name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                {jobTitle && <span className="truncate text-xs text-sidebar-foreground/70">{jobTitle}</span>}
                {email && <span className="truncate text-xs">{email}</span>}
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {backToAdmin && (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={backToAdmin}>
                    <ArrowLeft />
                    Back to admin account
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={`${base}/profile`}>
                  <UserCircle />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`${base}/settings`}>
                  <Settings />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`${base}/help`}>
                  <HelpCircle />
                  Help
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut}>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function ClientAccountMenu({
  clientSlug,
  hasSession,
  isAdmin,
  clientName,
  clientEmail,
  clientJobTitle,
  clientAvatarUrl,
  adminEmail,
  adminFullName,
  adminJobTitle,
  adminAvatarUrl,
  adminIconBgColor,
  adminIconTextColor,
}: {
  clientSlug: string;
  hasSession: boolean;
  isAdmin: boolean;
  clientName: string;
  clientEmail?: string;
  clientJobTitle?: string | null;
  clientAvatarUrl?: string | null;
  adminEmail?: string;
  adminFullName?: string | null;
  adminJobTitle?: string | null;
  adminAvatarUrl?: string | null;
  adminIconBgColor?: string | null;
  adminIconTextColor?: string | null;
}) {
  const router = useRouter();
  const [previewAsClient, setPreviewAsClient] = useState(false);
  const base = `/portal/${clientSlug}/app`;

  async function handleRealSignOut() {
    await fetch("/api/portal/sign-out", { method: "POST" });
    router.push(`/portal/${clientSlug}`);
  }

  if (hasSession) {
    return (
      <ClientStyleMenu
        base={base}
        name={clientName}
        email={clientEmail}
        jobTitle={clientJobTitle}
        avatarUrl={clientAvatarUrl}
        onSignOut={handleRealSignOut}
      />
    );
  }

  if (isAdmin) {
    // "Sign out" here must NOT call the real endpoint -- it would sign the
    // staff member out of their own session (same Supabase Auth session,
    // unified across staff/client). Exiting the preview is the correct
    // analog of "the client signing out" in this simulated context.
    if (previewAsClient) {
      return (
        <ClientStyleMenu
          base={base}
          name={clientName}
          email={clientEmail}
          jobTitle={clientJobTitle}
          avatarUrl={clientAvatarUrl}
          onSignOut={() => setPreviewAsClient(false)}
          backToAdmin={() => setPreviewAsClient(false)}
        />
      );
    }

    return (
      <AdminAccountMenu
        email={adminEmail ?? ""}
        fullName={adminFullName}
        jobTitle={adminJobTitle}
        avatarUrl={adminAvatarUrl}
        iconBgColor={adminIconBgColor}
        iconTextColor={adminIconTextColor}
        showBackToAdmin
        onViewAsClient={() => setPreviewAsClient(true)}
      />
    );
  }

  return null;
}
