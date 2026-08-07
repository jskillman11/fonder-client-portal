"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import type { TeamMemberRecord, UnlinkedStaffOption } from "@/lib/team-members";

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted-text)]";

// Once a roster entry is linked to a staff account, its name/role/icon
// colors come from that account's profile (see lib/team-members.ts) --
// editing here would just be silently overwritten on the next read, so
// this view is read-only plus an Unlink action instead of a form.
function LinkedTeamMemberView({ teamMember, currentUserId }: { teamMember: TeamMemberRecord; currentUserId: string | null }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "unlinking">("idle");
  const isSelf = teamMember.staffId === currentUserId;

  async function handleUnlink() {
    setStatus("unlinking");
    const res = await fetch("/api/admin/unlink-team-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: teamMember.id }),
    });
    const data = await res.json();
    setStatus("idle");

    if (!res.ok) {
      toast.error([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }
    router.refresh();
  }

  return (
    <Card className="px-9 py-8">
      <h1 className="text-[18px] font-bold text-[var(--color-ink)] mb-1">{teamMember.name}</h1>
      <p className="text-[13px] text-[var(--color-muted-text)] mb-4">{teamMember.role}</p>
      <p className="text-[13px] text-[var(--color-muted-text)]">
        Linked to the staff account <span className="font-medium">{teamMember.staffEmail}</span>.
        Name, role, and icon colors are synced from{" "}
        {isSelf ? (
          <Link href="/admin/settings/profile" className="underline text-[var(--color-ink)]">
            their profile
          </Link>
        ) : (
          "their profile"
        )}
        , not editable here.
      </p>
      <div className="pt-4 mt-4 border-t border-[var(--color-border)]">
        <button type="button" onClick={handleUnlink} className="text-[13px] text-[#a32d2d] underline">
          {status === "unlinking" ? "Unlinking…" : "Unlink from this staff account"}
        </button>
      </div>
    </Card>
  );
}

function UnlinkedTeamMemberForm({ teamMember }: { teamMember: TeamMemberRecord }) {
  const router = useRouter();
  const [staffOptions, setStaffOptions] = useState<UnlinkedStaffOption[]>([]);
  const [name, setName] = useState(teamMember.name);
  const [role, setRole] = useState(teamMember.role);
  const [colors, setColors] = useState<{ bg: string; text: string } | null>(
    teamMember.iconBgColor && teamMember.iconTextColor
      ? { bg: teamMember.iconBgColor, text: teamMember.iconTextColor }
      : null,
  );
  const [status, setStatus] = useState<"idle" | "saving" | "deleting" | "linking">("idle");

  useEffect(() => {
    fetch("/api/admin/list-unlinked-staff")
      .then((res) => res.json())
      .then((data) => setStaffOptions(data.staff ?? []))
      .catch(() => {});
  }, []);

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

  async function handleLink(staffId: string) {
    if (!staffId) return;
    setStatus("linking");
    const res = await fetch("/api/admin/link-team-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: teamMember.id, staffId }),
    });
    const data = await res.json();
    setStatus("idle");

    if (!res.ok) {
      toast.error([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }
    toast.success("Linked.");
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

      {staffOptions.length > 0 && (
        <div className="mb-4 pb-4 border-b border-[var(--color-border)]">
          <label className={labelClass}>Link to a staff account</label>
          <select
            defaultValue=""
            onChange={(e) => handleLink(e.target.value)}
            className={inputClass}
            disabled={status === "linking"}
          >
            <option value="" disabled>
              {status === "linking" ? "Linking…" : "Select a staff account…"}
            </option>
            {staffOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName || s.email}
              </option>
            ))}
          </select>
          <p className="text-[12px] text-[var(--color-muted-text)] mt-1">
            Once linked, name/role/icon colors sync from that person&apos;s staff profile instead
            of the fields below.
          </p>
        </div>
      )}

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

export function EditTeamMemberForm({
  teamMember,
  currentUserId,
}: {
  teamMember: TeamMemberRecord;
  currentUserId: string | null;
}) {
  if (teamMember.staffId) {
    return <LinkedTeamMemberView teamMember={teamMember} currentUserId={currentUserId} />;
  }
  return <UnlinkedTeamMemberForm teamMember={teamMember} />;
}
