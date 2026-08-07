import Link from "next/link";
import { listTeamMembers } from "@/lib/team-members";
import { listStaff } from "@/lib/staff";
import { getAdminUser, isSuperAdminSession } from "@/lib/supabase/server";
import { Card } from "@/components/Card";
import { NewTeamMemberForm } from "@/components/admin/NewTeamMemberForm";
import { InviteStaffForm } from "@/components/admin/InviteStaffForm";
import { StaffList } from "@/components/admin/StaffList";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const [teamMembers, admin, isSuperAdmin] = await Promise.all([
    listTeamMembers(),
    getAdminUser(),
    isSuperAdminSession(),
  ]);
  const staff = isSuperAdmin ? await listStaff() : [];

  return (
    <main className="py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <h1 className="text-[20px] font-bold text-[var(--color-ink)]">Team</h1>

        <div>
          <h2 className="text-[15px] font-bold text-[var(--color-ink)] mb-1">Account team roster</h2>
          <p className="text-[13px] text-[var(--color-muted-text)] mb-3">
            Select from these on the engagement setup screen instead of typing name/role fresh
            each time.
          </p>

          <NewTeamMemberForm />

          {teamMembers.length === 0 ? (
            <Card className="px-9 py-9 text-center mt-3">
              <p className="text-[14px] text-[var(--color-muted-text)]">
                No team members yet — add the first one above.
              </p>
            </Card>
          ) : (
            <Card className="px-7 py-2 mt-3">
              {teamMembers.map((t) => (
                <Link
                  key={t.id}
                  href={`/admin/settings/team/${t.id}`}
                  className="flex items-center gap-3 py-3 border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-cream)] -mx-7 px-7"
                >
                  <div
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[11px] font-semibold shrink-0"
                    style={{
                      backgroundColor: t.iconBgColor || "#f2f1ec",
                      color: t.iconTextColor || "#181a1e",
                    }}
                  >
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">
                      {t.name}
                      {t.staffId && (
                        <span className="ml-2 text-[11px] font-medium text-[var(--color-muted-text)]">
                          &middot; linked to staff account
                        </span>
                      )}
                    </p>
                    <p className="text-[13px] text-[var(--color-muted-text)]">{t.role}</p>
                  </div>
                </Link>
              ))}
            </Card>
          )}
        </div>

        {isSuperAdmin && admin && (
          <div className="pt-4 border-t border-[var(--color-border)]">
            <h2 className="text-[15px] font-bold text-[var(--color-ink)] mb-1">Staff accounts</h2>
            <p className="text-[13px] text-[var(--color-muted-text)] mb-3">
              Who can sign in to the Fonder admin dashboard.
            </p>

            <InviteStaffForm />

            {staff.length === 0 ? (
              <Card className="px-9 py-9 text-center mt-3">
                <p className="text-[14px] text-[var(--color-muted-text)]">No staff accounts yet.</p>
              </Card>
            ) : (
              <Card className="px-7 py-2 mt-3">
                <StaffList staff={staff} currentUserId={admin.id} />
              </Card>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
