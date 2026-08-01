import { getAdminUser } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { AdminAccountMenu } from "@/components/admin/AdminAccountMenu";

const ADMIN_NAV_ITEMS = [
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
  const user = await getAdminUser();

  return (
    <DashboardShell
      navItems={ADMIN_NAV_ITEMS}
      accountSlot={<AdminAccountMenu email={user?.email ?? ""} />}
    >
      {children}
    </DashboardShell>
  );
}
