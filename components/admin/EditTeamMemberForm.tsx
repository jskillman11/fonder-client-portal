"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ICON_COLOR_PRESETS } from "@/lib/icon-color-presets";
import type { TeamMemberRecord } from "@/lib/team-members";

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted-text)]";

export function EditTeamMemberForm({ teamMember }: { teamMember: TeamMemberRecord }) {
  const router = useRouter();
  const [name, setName] = useState(teamMember.name);
  const [role, setRole] = useState(teamMember.role);
  const [colors, setColors] = useState<{ bg: string; text: string } | null>(
    teamMember.iconBgColor && teamMember.iconTextColor
      ? { bg: teamMember.iconBgColor, text: teamMember.iconTextColor }
      : null,
  );
  const [status, setStatus] = useState<"idle" | "saving" | "deleting">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");

    const res = await fetch("/api/admin/update-team-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: teamMember.id,
        name,
        role,
        iconBgColor: colors?.bg ?? null,
        iconTextColor: colors?.text ?? null,
      }),
    });
    const data = await res.json();
    setStatus("idle");

    if (!res.ok) {
      toast.error([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }
    toast.success("Saved.");
    router.refresh();
  }

  async function handleDelete() {
    setStatus("deleting");

    const res = await fetch("/api/admin/delete-team-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: teamMember.id }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("idle");
      toast.error([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }
    router.push("/admin/settings/team");
  }

  return (
    <Card className="px-9 py-8">
      <h1 className="text-[18px] font-bold text-[var(--color-ink)] mb-4">
        {teamMember.name}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Role</label>
          <input required value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} />
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
        <div className="flex justify-between items-center pt-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" className="text-[13px] text-[#a32d2d] underline">
                {status === "deleting" ? "Deleting…" : "Delete"}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {teamMember.name}?</AlertDialogTitle>
                <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <PillButton type="submit">
            {status === "saving" ? "Saving…" : "Save"}
          </PillButton>
        </div>
      </form>
    </Card>
  );
}
