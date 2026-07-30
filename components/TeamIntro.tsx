import { Card } from "./Card";
import type { TeamMember } from "@/lib/get-engagement";

export function TeamIntro({ team }: { team: TeamMember[] }) {
  return (
    <Card className="px-9 py-9 md:px-12 md:py-10">
      <h2 className="text-[19px] font-bold text-[var(--color-ink)] mb-1">
        Your team
      </h2>
      <p className="text-[14px] text-[var(--color-muted)] mb-6">
        The people working on your account.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {team.map((member) => (
          <div
            key={member.name}
            className="rounded-[14px] border border-[var(--color-border)] px-5 py-4"
          >
            <div className="w-10 h-10 rounded-[var(--radius-logo)] bg-[var(--color-cream)] border border-[var(--color-border)] mb-3 flex items-center justify-center text-[13px] font-semibold text-[var(--color-ink)]">
              {member.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">
              {member.name}
            </p>
            <p className="text-[13px] text-[var(--color-muted)]">
              {member.role}
            </p>
            {member.blurb && (
              <p className="text-[12.5px] text-[var(--color-faint)] mt-1.5 leading-relaxed">
                {member.blurb}
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
