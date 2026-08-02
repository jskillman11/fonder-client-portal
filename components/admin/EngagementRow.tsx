"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";

export function EngagementRow({
  companyId,
  clientSlug,
  clientName,
  engagementTitle,
}: {
  companyId: string;
  clientSlug: string;
  clientName: string;
  engagementTitle: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function handleSendLink() {
    setStatus("sending");
    setErrorDetail(null);

    const res = await fetch("/api/admin/send-portal-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientSlug }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorDetail(data.error || "Failed to send");
      return;
    }
    setStatus("sent");
  }

  return (
    <Card className="px-7 py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[15px] font-semibold text-[var(--color-ink)]">
            {clientName}
          </p>
          <p className="text-[13px] text-[var(--color-muted)]">
            {engagementTitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 items-center text-[13px]">
          <Link
            href={`/portal/${clientSlug}`}
            target="_blank"
            className="text-[var(--color-muted)] underline"
          >
            View portal
          </Link>
          <Link
            href={`/admin/companies/${companyId}/engagements/${clientSlug}`}
            className="font-medium text-[var(--color-ink)] underline"
          >
            Edit
          </Link>
          <button
            onClick={handleSendLink}
            className="font-medium text-[var(--color-ink)] underline"
          >
            {status === "sending" ? "Sending…" : "Send access link"}
          </button>
        </div>
      </div>
      {status === "sent" && (
        <p className="text-[12px] text-[var(--color-muted)] mt-2">
          Sent to the client&apos;s registered email.
        </p>
      )}
      {status === "error" && (
        <p className="text-[12px] text-[#a32d2d] mt-2">{errorDetail}</p>
      )}
    </Card>
  );
}
