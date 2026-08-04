"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Temporary one-off maintenance control -- remove this component and its
// usage once run successfully. See app/api/admin/backfill-logo-normalization.
export function BackfillLogosButton() {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  async function handleClick() {
    setRunning(true);
    const res = await fetch("/api/admin/backfill-logo-normalization", { method: "POST" });
    const data = await res.json();
    setRunning(false);

    if (!res.ok) {
      toast.error(data.error ?? "Backfill failed.");
      return;
    }

    const failed = data.results.filter((r: { status: string }) => r.status !== "ok");
    if (failed.length > 0) {
      toast.error(`${data.results.length - failed.length} normalized, ${failed.length} failed — check console.`);
      console.error("Backfill failures:", failed);
    } else {
      toast.success(`Normalized ${data.results.length} logo(s).`);
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-[12px] underline text-[var(--color-muted-text)]"
    >
      {running ? "Normalizing…" : "One-time: normalize all existing logos"}
    </button>
  );
}
