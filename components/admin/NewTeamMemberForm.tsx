"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";
import { ICON_COLOR_PRESETS } from "@/lib/icon-color-presets";

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted-text)]";

export function NewTeamMemberForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [colors, setColors] = useState<{ bg: string; text: string } | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

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
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorDetail([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }

    setName("");
    setRole("");
    setColors(null);
    setStatus("idle");
    router.refresh();
  }

  return (
    <Card className="px-9 py-7">
      <h2 className="text-[15px] font-bold text-[var(--color-ink)] mb-4">
        Add a team member
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
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
            />
          </div>
        </div>
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
