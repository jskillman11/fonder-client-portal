import { getAdminUser, isSuperAdminSession } from "@/lib/supabase/server";
import { listStaff } from "@/lib/staff";
import { listClientAccess } from "@/lib/client-access";
import { Card } from "@/components/Card";
import { BackButton } from "@/components/admin/BackButton";
import { InviteStaffForm } from "@/components/admin/InviteStaffForm";
import { StaffList } from "@/components/admin/StaffList";
import { ClientAccessList } from "@/components/admin/ClientAccessList";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const admin = await getAdminUser();
  const isSuperAdmin = await isSuperAdminSession();

  if (!isSuperAdmin || !admin) {
    return (
      <main className="py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-5">
          <BackButton />
          <Card className="px-9 py-9 text-center">
            <p className="text-[14px] text-[var(--color-muted)]">
              Only super-admins can manage users.
            </p>
          </Card>
        </div>
      </main>
    );
  }

  const [staff, clients] = await Promise.all([listStaff(), listClientAccess()]);

  return (
    <main className="py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <BackButton />
        <h1 className="text-[20px] font-bold text-[var(--color-ink)]">Users</h1>

        <InviteStaffForm />

        <Card className="px-7 py-2">
          <h2 className="text-[15px] font-bold text-[var(--color-ink)] pt-5 mb-1">Staff</h2>
          {staff.length === 0 ? (
            <p className="text-[13px] text-[var(--color-muted)] pb-5">
              No staff accounts yet.
            </p>
          ) : (
            <StaffList staff={staff} currentUserId={admin.id} />
          )}
        </Card>

        <Card className="px-7 py-2">
          <h2 className="text-[15px] font-bold text-[var(--color-ink)] pt-5 mb-1">
            Client portal access
          </h2>
          {clients.length === 0 ? (
            <p className="text-[13px] text-[var(--color-muted)] pb-5">No clients yet.</p>
          ) : (
            <ClientAccessList clients={clients} />
          )}
        </Card>
      </div>
    </main>
  );
}
