"use client";

import { useState } from "react";
import { Card } from "./Card";
import { PillButton } from "./PillButton";
import type { EngagementData } from "@/lib/engagements";

export function DocumentReview({
  engagement,
}: {
  engagement: EngagementData;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function handleSign() {
    setStatus("sending");
    setErrorDetail(null);

    try {
      const res = await fetch("/api/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientSlug: engagement.clientSlug }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorDetail(data.error || "Something went wrong.");
        return;
      }

      setStatus("sent");
    } catch {
      setStatus("error");
      setErrorDetail("Couldn't reach the signing service.");
    }
  }

  if (status === "sent") {
    return (
      <Card className="px-9 py-12 md:px-12 md:py-14 text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--color-cream)] border border-[var(--color-border)] mx-auto mb-6 flex items-center justify-center">
          <span className="text-[20px] text-[var(--color-ink)]">✉</span>
        </div>
        <h2 className="text-[20px] font-bold text-[var(--color-ink)] mb-3">
          Check your email
        </h2>
        <p className="text-[14.5px] text-[var(--color-muted)] max-w-sm mx-auto leading-relaxed">
          We&apos;ve sent a signing request to{" "}
          <strong>{engagement.clientSignatoryEmail}</strong>. Open it to
          review and sign your Statement of Work and Master Services
          Agreement.
        </p>
      </Card>
    );
  }

  return (
    <Card className="px-9 py-9 md:px-12 md:py-10">
      <h2 className="text-[19px] font-bold text-[var(--color-ink)] mb-1">
        Review &amp; sign
      </h2>
      <p className="text-[14px] text-[var(--color-muted)] mb-6">
        Both documents below are part of this engagement. You&apos;ll sign
        them together in one session.
      </p>

      <div className="space-y-3 mb-7">
        {engagement.documents.map((doc) => (
          <div
            key={doc.label}
            className="flex items-start justify-between rounded-[14px] border border-[var(--color-border)] px-5 py-4"
          >
            <div>
              <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">
                {doc.label}
              </p>
              <p className="text-[13px] text-[var(--color-muted)] mt-0.5">
                {doc.description}
              </p>
            </div>
            <span className="text-[12px] font-medium text-[var(--color-faint)] whitespace-nowrap ml-4">
              PDF
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-[14px] bg-[var(--color-cream)] px-5 py-4 mb-7">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Total fee
          </p>
          <p className="text-[15px] font-semibold text-[var(--color-ink)]">
            {engagement.totalFee}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Final delivery
          </p>
          <p className="text-[15px] font-semibold text-[var(--color-ink)]">
            {engagement.finalDeliveryDate}
          </p>
        </div>
      </div>

      {status === "error" && (
        <p className="text-[13px] text-center text-[#a32d2d] mb-4">
          {errorDetail}
        </p>
      )}

      <div className="flex justify-center">
        <PillButton onClick={handleSign}>
          {status === "sending" ? "Sending…" : "Review & sign"}
        </PillButton>
      </div>
    </Card>
  );
}
