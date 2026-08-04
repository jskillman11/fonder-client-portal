"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PillButton } from "@/components/PillButton";

export function CreateInvoiceForm({ engagementId }: { engagementId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function handleCreate() {
    setStatus("saving");
    setErrorDetail(null);

    const res = await fetch("/api/admin/quickbooks/create-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ engagementId }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorDetail([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <p className="text-[13px] text-[var(--color-muted-text)] mb-3">
        Creates a real QuickBooks invoice for this engagement&apos;s numeric fee and generates a
        hosted pay-page link for the client.
      </p>
      {status === "error" && <p className="text-[13px] text-[#a32d2d] mb-3">{errorDetail}</p>}
      <PillButton onClick={handleCreate}>
        {status === "saving" ? "Creating…" : "Create & send invoice"}
      </PillButton>
    </div>
  );
}
