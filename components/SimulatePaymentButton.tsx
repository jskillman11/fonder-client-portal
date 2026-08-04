"use client";

import { useState } from "react";

export function SimulatePaymentButton({
  engagementId,
  onSimulated,
}: {
  engagementId: string;
  onSimulated?: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function handleClick() {
    setStatus("working");
    setErrorDetail(null);

    const res = await fetch("/api/admin/quickbooks/simulate-payment", {
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

    onSimulated?.();
  }

  return (
    <div className="mt-2">
      <button
        onClick={handleClick}
        disabled={status === "working"}
        className="text-[12px] font-medium text-[var(--color-muted)] underline"
      >
        {status === "working" ? "Simulating…" : "Simulate payment (sandbox testing)"}
      </button>
      {status === "error" && <p className="text-[12px] text-[#a32d2d] mt-1">{errorDetail}</p>}
    </div>
  );
}
