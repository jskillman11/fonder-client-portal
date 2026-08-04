"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function QuickBooksDisconnectButton() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");

  async function handleDisconnect() {
    if (
      !confirm(
        "Disconnect QuickBooks? Existing invoices are unaffected, but no new invoices can be created until reconnected.",
      )
    ) {
      return;
    }
    setStatus("working");

    const res = await fetch("/api/admin/quickbooks/disconnect", { method: "POST" });
    if (!res.ok) {
      setStatus("error");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={handleDisconnect}
        disabled={status === "working"}
        className="text-[13px] font-medium text-[#a32d2d] underline"
      >
        {status === "working" ? "Disconnecting…" : "Disconnect"}
      </button>
      {status === "error" && (
        <p className="text-[13px] text-[#a32d2d] mt-2">Something went wrong.</p>
      )}
    </div>
  );
}
