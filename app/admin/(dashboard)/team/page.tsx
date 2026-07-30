import Link from "next/link";
import { listTeamMembers } from "@/lib/team-members";
import { Card } from "@/components/Card";
import { NewTeamMemberForm } from "@/components/admin/NewTeamMemberForm";
import { BackButton } from "@/components/admin/BackButton";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const teamMembers = await listTeamMembers();

  return (
    <main className="py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <BackButton />
        <h1 className="text-[20px] font-bold text-[var(--color-ink)]">
          Team
        </h1>
        <p className="text-[13px] text-[var(--color-muted)]">
          Fonder's own roster — select from these on the engagement setup
          screen instead of typing name/role fresh each time.
        </p>

        <NewTeamMemberForm />

        {teamMembers.length === 0 ? (
          <Card className="px-9 py-9 text-center">
            <p className="text-[14px] text-[var(--color-muted)]">
              No team members yet — add the first one above.
            </p>
          </Card>
        ) : (
          <Card className="px-7 py-2">
            {teamMembers.map((t) => (
              <Link
                key={t.id}
                href={`/admin/team/${t.id}`}
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
                  </p>
                  <p className="text-[13px] text-[var(--color-muted)]">{t.role}</p>
                </div>
              </Link>
            ))}
          </Card>
        )}
      </div>
    </main>
  );
}
