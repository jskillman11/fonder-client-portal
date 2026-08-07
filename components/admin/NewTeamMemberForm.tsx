"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";
import { ICON_COLOR_PRESETS } from "@/lib/icon-color-presets";
import type { UnlinkedStaffOption } from "@/lib/team-members";

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted-text)]";

export function NewTeamMemberForm() {
  const router = useRouter();
  const [staffOptions, setStaffOptions] = useState<UnlinkedStaffOption[]>([]);
  const [staffId, setStaffId] = useState<string>("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [colors, setColors] = useState<{ bg: string; text: string } | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/list-unlinked-staff")
      .then((res) => res.json())
      .then((data) => setStaffOptions(data.staff ?? []))
      .catch(() => {});
  }, []);

  function handleSelectStaff(id: string) {
    setStaffId(id);
    const staff = staffOptions.find((s) => s.id === id);
    if (staff) {
      setName(staff.fullName || staff.email);
      setRole(staff.jobTitle || "");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorDetail(null);

    const res = await fetch("/api/admin/create-team-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        role,
        iconBgColor: colors?.bg ?? null,
        iconTextColor: colors?.text ?? null,
        staffId: staffId || null,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorDetail([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }

    setStaffId("");
    setName("");
    setRole("");
    setColors(null);
    setStatus("idle");
    router.refresh();
  }

  const isLinked = Boolean(staffId);

  return (
    <Card className="px-9 py-7">
      <h2 className="text-[15px] font-bold text-[var(--color-ink)] mb-4">
        Add a team member
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        {staffOptions.length > 0 && (
          <div>
            <label className={labelClass}>Link to a staff account (optional)</label>
            <select
              value={staffId}
              onChange={(e) => handleSelectStaff(e.target.value)}
              className={inputClass}
            >
              <option value="">— add manually —</option>
              {staffOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName || s.email}
                </option>
              ))}
            </select>
            {isLinked && (
              <p className="text-[12px] text-[var(--color-muted-text)] mt-1">
                Name, role, and icon colors will stay in sync with this person&apos;s staff
                profile.
              </p>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              disabled={isLinked}
            />
          </div>
          <div>
            <label className={labelClass}>Role</label>
            <input
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={inputClass}
              placeholder="Founder, Creative Director"
              disabled={isLinked}
            />
          </div>
        </div>
        {!isLinked && (
          <div>
            <label className={labelClass}>Icon colors</label>
            <div className="flex gap-2 mt-1">
              {ICON_COLOR_PRESETS.map((preset) => {
                const isSelected = colors?.bg === preset.bg && colors?.text === preset.text;
                return (
                  <button
                    key={preset.bg}
                    type="button"
                    onClick={() => setColors(preset)}
                    className={`w-9 h-9 rounded-[8px] flex items-center justify-center text-[11px] font-bold ${
                      isSelected ? "ring-2 ring-offset-2 ring-[var(--color-ink)]" : "border border-[var(--color-border)]"
                    }`}
                    style={{ backgroundColor: preset.bg, color: preset.text }}
                    title={`${preset.bg} / ${preset.text}`}
                  >
                    Aa
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setColors(null)}
                className="w-9 h-9 rounded-[8px] border border-dashed border-[var(--color-border)] text-[11px] text-[var(--color-faint)]"
                title="Default"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <PillButton type="submit">
            {status === "saving" ? "Adding…" : "Add"}
          </PillButton>
        </div>
      </form>
      {status === "error" && <p className="text-[13px] text-[#a32d2d] mt-3">{errorDetail}</p>}
    </Card>
  );
}
