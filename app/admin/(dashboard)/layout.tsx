import { getAdminUser, isSuperAdminSession } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { AdminAccountMenu } from "@/components/admin/AdminAccountMenu";

const BASE_ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/companies", label: "Companies" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/documents", label: "Documents" },
  { href: "/admin/team", label: "Team" },
  { href: "/admin/content", label: "Portal content" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, isSuperAdmin] = await Promise.all([getAdminUser(), isSuperAdminSession()]);

  const navItems = isSuperAdmin
    ? [...BASE_ADMIN_NAV_ITEMS, { href: "/admin/users", label: "Users" }]
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
