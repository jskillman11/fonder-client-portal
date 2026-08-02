"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PillButton } from "@/components/PillButton";
import type { TeamMemberRecord } from "@/lib/team-members";

export function CompanyTeamForm({
  companyId,
  initialTeamMemberIds,
}: {
  companyId: string;
  initialTeamMemberIds: string[];
}) {
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMemberRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialTeamMemberIds);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/list-team-members")
      .then((res) => res.json())
      .then((data) => {
        setTeamMembers(data.teamMembers ?? []);
        setLoadingOptions(false);
      })
      .catch(() => setLoadingOptions(false));
  }, []);

  function toggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorDetail(null);

    const res = await fetch("/api/admin/update-company-team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, teamMemberIds: selectedIds }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorDetail([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }

    setStatus("saved");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[13px] text-[var(--color-muted)]">
          Select who&apos;s shown on this brand&apos;s portal.
        </p>
        <Link
          href="/admin/settings/team"
          target="_blank"
          className="text-[12px] underline text-[var(--color-muted)] shrink-0 ml-3"
        >
          + New team member
        </Link>
      </div>

      {loadingOptions ? (
        <p className="text-[13px] text-[var(--color-muted)] mt-3">Loading…</p>
      ) : teamMembers.length === 0 ? (
        <p className="text-[13px] text-[var(--color-muted)] mt-3">
          No team members yet — add some via the &quot;+ New team member&quot; link above.
        </p>
      ) : (
        <div className="space-y-2 mt-3">
          {teamMembers.map((t) => {
            const isChecked = selectedIds.includes(t.id);
            return (
              <label
                key={t.id}
                className="flex items-center gap-3 rounded-[10px] border border-[var(--color-border)] px-4 py-2.5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(t.id)}
                  className="w-4 h-4"
                />
                <div
                  className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[10px] font-semibold shrink-0"
                  style={{
                    backgroundColor: t.iconBgColor || "#f2f1ec",
                    color: t.iconTextColor || "#181a1e",
                  }}
                >
                  {t.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-[13.5px] font-semibold text-[var(--color-ink)]">{t.name}</p>
                  <p className="text-[12px] text-[var(--color-muted)]">{t.role}</p>
                </div>
              </label>
            );
          })}
        </div>
      )}

      {status === "error" && (
        <p className="text-[13px] text-[#a32d2d] mt-3">{errorDetail}</p>
      )}
      {status === "saved" && (
        <p className="text-[13px] text-[var(--color-ink)] mt-3">Saved.</p>
      )}

      <div className="flex justify-end mt-4">
        <PillButton type="submit">{status === "saving" ? "Saving…" : "Save changes"}</PillButton>
      </div>
    </form>
  );
}
