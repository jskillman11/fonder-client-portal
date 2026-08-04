import { Card } from "./Card";
import type { TeamMember } from "@/lib/get-engagement";

export function TeamIntro({
  team,
  heading,
  subheading,
}: {
  team: TeamMember[];
  heading: string;
  subheading: string;
}) {
  return (
    <Card className="px-9 py-9 md:px-12 md:py-10">
      <h2 className="text-[19px] font-bold text-[var(--color-ink)] mb-1">
        {heading}
      </h2>
      <p className="text-[14px] text-[var(--color-muted-text)] mb-6">
        {subheading}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {team.map((member) => (
          <div
            key={member.name}
            className="rounded-[14px] border border-[var(--color-border)] px-5 py-4"
          >
            <div
              className="w-10 h-10 rounded-[var(--radius-logo)] mb-3 flex items-center justify-center text-[13px] font-semibold"
              style={{
                backgroundColor: member.iconBgColor || "#f2f1ec",
                color: member.iconTextColor || "#181a1e",
                border: member.iconBgColor
                  ? "none"
                  : "1px solid #ded9cf",
              }}
            >
              {member.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">
              {member.name}
            </p>
            <p className="text-[13px] text-[var(--color-muted-text)]">
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
