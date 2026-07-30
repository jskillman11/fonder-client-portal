"use client";

import { useState } from "react";
import { Card } from "./Card";
import { PillButton } from "./PillButton";
import type { EngagementData } from "@/lib/get-engagement";

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
        setErrorDetail(
          [data.error, data.detail].filter(Boolean).join(" — ") ||
            "Something went wrong.",
        );
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
        You&apos;ve read the Statement of Work and Master Services Agreement
        above. Signing below covers both, in one session.
      </p>

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
