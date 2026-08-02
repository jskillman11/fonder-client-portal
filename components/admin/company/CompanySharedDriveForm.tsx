"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PillButton } from "@/components/PillButton";

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted)]";

export function CompanySharedDriveForm({
  companyId,
  initialSharedDriveUrl,
}: {
  companyId: string;
  initialSharedDriveUrl: string;
}) {
  const router = useRouter();
  const [sharedDriveUrl, setSharedDriveUrl] = useState(initialSharedDriveUrl);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorDetail(null);

    const res = await fetch("/api/admin/update-company-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, sharedDriveUrl }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorDetail([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }

    setStatus("saved");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="text-[13px] text-[var(--color-muted)] mb-3">
        Where the client&apos;s Shared Drive tab redirects to.
      </p>
      <div>
        <label className={labelClass}>Shared Drive URL</label>
        <input
          type="url"
          value={sharedDriveUrl}
          onChange={(e) => setSharedDriveUrl(e.target.value)}
          className={inputClass}
          placeholder="https://drive.google.com/drive/folders/..."
        />
      </div>

      {status === "error" && (
        <p className="text-[13px] text-[#a32d2d] mt-3">{errorDetail}</p>
      )}
      {status === "saved" && (
        <p className="text-[13px] text-[var(--color-ink)] mt-3">Saved.</p>
      )}

      <div className="flex justify-end mt-4">
        <PillButton type="submit">{status === "saving" ? "Saving…" : "Save changes"}</PillButton>
      </div>
    </form>
  );
}
