"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";
import type { UnlinkedStaffOption } from "@/lib/team-members";

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted-text)]";

// Every roster entry must now be linked to a real staff account -- name,
// role, photo, and icon colors always come from that account's profile
// (see EditProfileForm on the team member's detail page), so there's
// nothing else to fill in here beyond picking who to add.
export function NewTeamMemberForm() {
  const router = useRouter();
  const [staffOptions, setStaffOptions] = useState<UnlinkedStaffOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [staffId, setStaffId] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/list-unlinked-staff")
      .then((res) => res.json())
      .then((data) => {
        setStaffOptions(data.staff ?? []);
        setLoadingOptions(false);
      })
      .catch(() => setLoadingOptions(false));
  }, []);

  const selected = staffOptions.find((s) => s.id === staffId) ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setStatus("saving");
    setErrorDetail(null);

    const res = await fetch("/api/admin/create-team-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: selected.fullName || selected.email,
        role: selected.jobTitle || "",
        staffId: selected.id,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorDetail([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }

    setStaffId("");
    setStatus("idle");
    router.refresh();
  }

  if (loadingOptions) {
    return (
      <Card className="px-9 py-7">
        <p className="text-[13px] text-[var(--color-muted-text)]">Loading…</p>
      </Card>
    );
  }

  return (
    <Card className="px-9 py-7">
      <h2 className="text-[15px] font-bold text-[var(--color-ink)] mb-4">
        Add a team member
      </h2>
      {staffOptions.length === 0 ? (
        <p className="text-[13px] text-[var(--color-muted-text)]">
          Every staff account is already on the roster — invite a new one below to add them here
          too.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={labelClass}>Staff account</label>
            <select
              required
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>
                Select a staff account…
              </option>
              {staffOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName || s.email}
                </option>
              ))}
            </select>
            {selected && (
              <p className="text-[12px] text-[var(--color-muted-text)] mt-1">
                Name, role, and icon colors will stay in sync with{" "}
                {selected.fullName || selected.email}&apos;s staff profile.
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <PillButton type="submit">{status === "saving" ? "Adding…" : "Add"}</PillButton>
          </div>
        </form>
      )}
      {status === "error" && <p className="text-[13px] text-[#a32d2d] mt-3">{errorDetail}</p>}
    </Card>
  );
}
