import { getAdminUser, isSuperAdminSession } from "@/lib/supabase/server";
import { listCompanies } from "@/lib/companies-clients";
import { getSidebarLogoUrl } from "@/lib/brand-settings";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminAccountMenu } from "@/components/admin/AdminAccountMenu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, isSuperAdmin, companies, sidebarLogoUrl] = await Promise.all([
    getAdminUser(),
    isSuperAdminSession(),
    listCompanies(),
    getSidebarLogoUrl(),
  ]);

  return (
    <AdminNav
      companies={companies}
      isSuperAdmin={isSuperAdmin}
      sidebarLogoUrl={sidebarLogoUrl}
      accountSlot={
        <AdminAccountMenu
          email={user?.email ?? ""}
          fullName={user?.fullName ?? null}
          jobTitle={user?.jobTitle ?? null}
          avatarUrl={user?.avatarUrl ?? null}
          iconBgColor={user?.iconBgColor ?? null}
          iconTextColor={user?.iconTextColor ?? null}
        />
      }
    >
      {children}
    </AdminNav>
  );
}
