import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

// Static brand block at the top of the client portal sidebar -- there's
// nothing to switch between (one client, one company), so this is plain
// info, not a dropdown dressed up to look disabled. asChild + a <div>
// (rather than rendering as a real <button>) means no click/hover/focus
// affordances at all, while still reusing SidebarMenuButton's proven
// size="lg" spacing and icon-collapse behavior.
export function ClientBrandHeader({
  companyName,
  companyLogoUrl,
  engagementTitle,
}: {
  companyName: string;
  companyLogoUrl: string | null;
  engagementTitle?: string | null;
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild className="cursor-default hover:bg-transparent active:bg-transparent">
          <div>
            <Avatar className="h-8 w-8 rounded-lg after:rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              {companyLogoUrl && (
                <AvatarImage src={companyLogoUrl} alt={companyName} className="rounded-lg object-cover" />
              )}
              <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {companyName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 min-w-0 text-left text-sm leading-tight">
              <span className="truncate font-medium">{companyName}</span>
              {engagementTitle && (
                <span className="truncate text-xs text-sidebar-foreground/70">{engagementTitle}</span>
              )}
            </div>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
