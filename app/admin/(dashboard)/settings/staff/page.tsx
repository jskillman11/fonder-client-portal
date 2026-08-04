import { getAdminUser, isSuperAdminSession } from "@/lib/supabase/server";
import { listStaff } from "@/lib/staff";
import { Card } from "@/components/Card";
import { BackButton } from "@/components/admin/BackButton";
import { InviteStaffForm } from "@/components/admin/InviteStaffForm";
import { StaffList } from "@/components/admin/StaffList";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const admin = await getAdminUser();
  const isSuperAdmin = await isSuperAdminSession();

  if (!isSuperAdmin || !admin) {
    return (
      <main className="py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-5">
          <BackButton />
          <Card className="px-9 py-9 text-center">
            <p className="text-[14px] text-[var(--color-muted-text)]">
              Only super-admins can manage staff.
            </p>
          </Card>
        </div>
      </main>
    );
  }

  const staff = await listStaff();

  return (
    <main className="py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <BackButton />
        <h1 className="text-[20px] font-bold text-[var(--color-ink)]">Staff</h1>

        <InviteStaffForm />

        {staff.length === 0 ? (
          <Card className="px-9 py-9 text-center">
            <p className="text-[14px] text-[var(--color-muted-text)]">
              No staff accounts yet.
            </p>
          </Card>
        ) : (
          <Card className="px-7 py-2">
            <StaffList staff={staff} currentUserId={admin.id} />
          </Card>
        )}
      </div>
    </main>
  );
}
