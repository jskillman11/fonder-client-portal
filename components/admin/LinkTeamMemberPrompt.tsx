"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/Card";
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
import type { TeamMemberRecord, UnlinkedStaffOption } from "@/lib/team-members";

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";

// Every roster entry is now expected to be linked to a real staff account --
// name/role/photo/icon all come from that account's profile (EditProfileForm),
// not from free-text fields here. This is what a legacy unlinked row (one
// that predates that rule) shows on its detail page: nothing to edit until
// it's linked, plus the option to remove it from the roster entirely.
export function LinkTeamMemberPrompt({ teamMember }: { teamMember: TeamMemberRecord }) {
  const router = useRouter();
  const [staffOptions, setStaffOptions] = useState<UnlinkedStaffOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [status, setStatus] = useState<"idle" | "linking" | "deleting">("idle");

  useEffect(() => {
    fetch("/api/admin/list-unlinked-staff")
      .then((res) => res.json())
      .then((data) => {
        setStaffOptions(data.staff ?? []);
        setLoadingOptions(false);
      })
      .catch(() => setLoadingOptions(false));
  }, []);

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
    router.push("/admin/settings");
  }

  return (
    <Card className="px-9 py-8">
      <h1 className="text-[18px] font-bold text-[var(--color-ink)] mb-1">{teamMember.name}</h1>
      <p className="text-[13px] text-[var(--color-muted-text)] mb-4">{teamMember.role}</p>
      <p className="text-[13px] text-[var(--color-muted-text)] mb-3">
        This roster entry isn&apos;t linked to a staff account yet. Link it to sync its name,
        role, and photo from a real login.
      </p>

      {loadingOptions ? (
        <p className="text-[13px] text-[var(--color-muted-text)]">Loading…</p>
      ) : staffOptions.length > 0 ? (
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
      ) : (
        <p className="text-[13px] text-[var(--color-muted-text)]">
          No unlinked staff accounts available —{" "}
          <Link href="/admin/settings" className="underline text-[var(--color-ink)]">
            invite one
          </Link>{" "}
          first.
        </p>
      )}

      <div className="pt-4 mt-4 border-t border-[var(--color-border)]">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button type="button" className="text-[13px] text-[#a32d2d] underline">
              {status === "deleting" ? "Removing…" : "Remove from roster"}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove {teamMember.name} from the roster?</AlertDialogTitle>
              <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Remove</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}
