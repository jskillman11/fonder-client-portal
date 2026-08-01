import { getAdminUser, isSuperAdminSession } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { AdminAccountMenu } from "@/components/admin/AdminAccountMenu";

const BASE_ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Engagements", section: "Engagements" },
  { href: "/admin/companies", label: "Companies", section: "Engagements" },
  { href: "/admin/clients", label: "Clients", section: "Engagements" },
  { href: "/admin/documents", label: "Documents", section: "Engagements" },
  { href: "/admin/team", label: "Team", section: "Portal Content" },
  { href: "/admin/content", label: "Portal content", section: "Portal Content" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, isSuperAdmin] = await Promise.all([getAdminUser(), isSuperAdminSession()]);

  const navItems = isSuperAdmin
    ? [...BASE_ADMIN_NAV_ITEMS, { href: "/admin/staff", label: "Staff", section: "Staff" }]
    : BASE_ADMIN_NAV_ITEMS;

  return (
    <DashboardShell
      navItems={navItems}
      accountSlot={<AdminAccountMenu email={user?.email ?? ""} />}
    >
      {children}
    </DashboardShell>
  );
}
