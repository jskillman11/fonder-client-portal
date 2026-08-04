import { getAdminUser, isSuperAdminSession } from "@/lib/supabase/server";
import { listCompanies } from "@/lib/companies-clients";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminAccountMenu } from "@/components/admin/AdminAccountMenu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, isSuperAdmin, companies] = await Promise.all([
    getAdminUser(),
    isSuperAdminSession(),
    listCompanies(),
  ]);

  return (
    <AdminNav
      companies={companies}
      isSuperAdmin={isSuperAdmin}
      accountSlot={
        <AdminAccountMenu
          email={user?.email ?? ""}
          fullName={user?.fullName ?? null}
          jobTitle={user?.jobTitle ?? null}
          avatarUrl={user?.avatarUrl ?? null}
        />
      }
    >
      {children}
    </AdminNav>
  );
}
