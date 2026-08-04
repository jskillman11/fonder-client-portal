"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted-text)]";

export function InviteStaffForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [makeSuperAdmin, setMakeSuperAdmin] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorDetail(null);

    const res = await fetch("/api/admin/invite-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, makeSuperAdmin }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorDetail(data.error);
      return;
    }

    setEmail("");
    setMakeSuperAdmin(false);
    setStatus("idle");
    router.refresh();
  }

  return (
    <Card className="px-9 py-7">
      <h2 className="text-[15px] font-bold text-[var(--color-ink)] mb-4">
        Invite a staff member
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <label className="flex items-center gap-2 text-[13px] text-[var(--color-muted-text)]">
          <input
            type="checkbox"
            checked={makeSuperAdmin}
            onChange={(e) => setMakeSuperAdmin(e.target.checked)}
          />
          Make this person a super-admin (can invite/remove other staff)
        </label>
        <div className="flex justify-end">
          <PillButton type="submit">
            {status === "saving" ? "Sending…" : "Send invite"}
          </PillButton>
        </div>
      </form>
      {status === "error" && <p className="text-[13px] text-[#a32d2d] mt-3">{errorDetail}</p>}
    </Card>
  );
}
