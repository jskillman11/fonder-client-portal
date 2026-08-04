"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import type { EngagementStatus } from "@/lib/get-engagement";

export function EngagementRow({
  companyId,
  companyClientSlug,
  engagementId,
  clientName,
  engagementTitle,
  status: engagementStatus,
}: {
  companyId: string;
  companyClientSlug: string | null;
  engagementId: string;
  clientName: string;
  engagementTitle: string;
  status: EngagementStatus;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function handleSendLink() {
    if (!companyClientSlug) return;
    setStatus("sending");
    setErrorDetail(null);

    const res = await fetch("/api/admin/send-portal-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientSlug: companyClientSlug }),
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
          <div className="flex items-center gap-2">
            <p className="text-[15px] font-semibold text-[var(--color-ink)]">{clientName}</p>
            <span
              className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-[var(--radius-pill)] ${
                engagementStatus === "active"
                  ? "bg-[var(--color-cream)] text-[var(--color-ink)]"
                  : "text-[var(--color-faint)] border border-[var(--color-border)]"
              }`}
            >
              {engagementStatus}
            </span>
          </div>
          <p className="text-[13px] text-[var(--color-muted-text)]">{engagementTitle}</p>
        </div>
        <div className="flex flex-wrap gap-4 items-center text-[13px]">
          {companyClientSlug && (
            <Link
              href={`/portal/${companyClientSlug}`}
              target="_blank"
              className="text-[var(--color-muted-text)] underline"
            >
              View portal
            </Link>
          )}
          <Link
            href={`/admin/companies/${companyId}/engagements/${engagementId}`}
            className="font-medium text-[var(--color-ink)] underline"
          >
            Edit
          </Link>
          {companyClientSlug && (
            <button
              onClick={handleSendLink}
              className="font-medium text-[var(--color-ink)] underline"
            >
              {status === "sending" ? "Sending…" : "Send access link"}
            </button>
          )}
        </div>
      </div>
      {status === "sent" && (
        <p className="text-[12px] text-[var(--color-muted-text)] mt-2">
          Sent to the client&apos;s registered email.
        </p>
      )}
      {status === "error" && (
        <p className="text-[12px] text-[#a32d2d] mt-2">{errorDetail}</p>
      )}
    </Card>
  );
}
