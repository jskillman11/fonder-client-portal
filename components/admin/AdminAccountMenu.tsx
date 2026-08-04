"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronsUpDown, Settings, HelpCircle, LogOut, UserCircle, ArrowLeft, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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

// Falls back to something readable derived from the email's local part when
// a staff member hasn't set a display name yet.
function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function initialsFromName(name: string): string {
  const words = name.split(" ").filter(Boolean);
  const initials = words.slice(0, 2).map((w) => w.charAt(0).toUpperCase());
  return initials.join("") || "?";
}

export function AdminAccountMenu({
  email,
  fullName,
  jobTitle,
  avatarUrl,
  showBackToAdmin,
  onViewAsClient,
}: {
  email: string;
  fullName?: string | null;
  jobTitle?: string | null;
  avatarUrl?: string | null;
  // Set when this renders inside a client portal a staff member is
  // previewing (see ClientAccountMenu) -- offers a way back without
  // otherwise changing this component's own behavior.
  showBackToAdmin?: boolean;
  // Also portal-preview-only: switches ClientAccountMenu into showing the
  // real client-facing menu (same account, still staff underneath -- not a
  // real session change).
  onViewAsClient?: () => void;
}) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const name = fullName || displayNameFromEmail(email);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

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
                <span className="truncate text-xs">{email}</span>
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
            {(showBackToAdmin || onViewAsClient) && (
              <>
                <DropdownMenuGroup>
                  {showBackToAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <ArrowLeft />
                        Back to admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {onViewAsClient && (
                    <DropdownMenuItem onClick={onViewAsClient}>
                      <Eye />
                      View as client
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/admin/settings/profile">
                  <UserCircle />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/settings">
                  <Settings />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/help">
                  <HelpCircle />
                  Help
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
