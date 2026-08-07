"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function UnlinkTeamMemberButton({ teamMemberId }: { teamMemberId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "unlinking">("idle");

  async function handleUnlink() {
    setStatus("unlinking");

    const res = await fetch("/api/admin/unlink-team-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: teamMemberId }),
    });
    const data = await res.json();
    setStatus("idle");

    if (!res.ok) {
      toast.error([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }
    toast.success("Unlinked.");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleUnlink} className="text-[13px] text-[#a32d2d] underline">
      {status === "unlinking" ? "Unlinking…" : "Unlink from this staff account"}
    </button>
  );
}
