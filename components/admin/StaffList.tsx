"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StaffRecord } from "@/lib/staff";

export function StaffList({
  staff,
  currentUserId,
}: {
  staff: StaffRecord[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function handleToggleSuperAdmin(id: string, next: boolean) {
    setBusyId(id);
    setErrorDetail(null);

    const res = await fetch("/api/admin/update-staff-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isSuperAdmin: next }),
    });
    const data = await res.json();

    setBusyId(null);
    if (!res.ok) {
      setErrorDetail(data.error);
      return;
    }
    router.refresh();
  }

  async function handleRemove(id: string, email: string) {
    if (!confirm(`Remove ${email}'s access to the admin dashboard? This can't be undone.`)) return;
    setBusyId(id);
    setErrorDetail(null);

    const res = await fetch("/api/admin/remove-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();

    setBusyId(null);
    if (!res.ok) {
      setErrorDetail(data.error);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {staff.map((s) => {
        const isSelf = s.id === currentUserId;
        const busy = busyId === s.id;

        return (
          <div
            key={s.id}
            className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-b-0"
          >
            <div>
              <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">
                {s.email}
                {isSelf && <span className="text-[var(--color-faint)] font-normal"> (you)</span>}
              </p>
              <p className="text-[13px] text-[var(--color-muted)]">
                {s.isSuperAdmin ? "Super-admin" : "Staff"} ·{" "}
                {s.hasAccepted ? "Active" : "Invited, not yet accepted"}
              </p>
            </div>
            <div className="flex gap-4 items-center text-[13px]">
              <button
                type="button"
                disabled={busy}
                onClick={() => handleToggleSuperAdmin(s.id, !s.isSuperAdmin)}
                className="font-medium text-[var(--color-ink)] underline disabled:opacity-50"
              >
                {s.isSuperAdmin ? "Remove super-admin" : "Make super-admin"}
              </button>
              <button
                type="button"
                disabled={busy || isSelf}
                onClick={() => handleRemove(s.id, s.email)}
                className="font-medium text-[#a32d2d] underline disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>
        );
      })}
      {errorDetail && <p className="text-[13px] text-[#a32d2d] mt-3">{errorDetail}</p>}
    </div>
  );
}
