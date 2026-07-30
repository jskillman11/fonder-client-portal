"use client";

import { useState } from "react";
import { Card } from "./Card";
import { PillButton } from "./PillButton";
import type { EngagementData } from "@/lib/engagements";

export function DocumentReview({
  engagement,
  onSigned,
}: {
  engagement: EngagementData;
  onSigned: () => void;
}) {
  const [signing, setSigning] = useState(false);

  async function handleSign() {
    setSigning(true);

    // ---------------------------------------------------------------------
    // TODO(integration): replace this mock with a real call to your
    // self-hosted Documenso instance once it's live. Typical shape:
    //
    //   const res = await fetch("/api/sign", {
    //     method: "POST",
    //     body: JSON.stringify({ clientSlug: engagement.clientSlug }),
    //   });
    //   const { signingUrl } = await res.json();
    //   window.location.href = signingUrl; // hand off to Documenso's signing UI,
    //                                       // or embed it in an iframe if preferred
    //
    // The API route (/app/api/sign/route.ts) would call Documenso's API to
    // create a signing session for this client's SOW + MSA, using the
    // Documenso instance URL + API key as environment variables.
    // ---------------------------------------------------------------------
    await new Promise((r) => setTimeout(r, 900)); // simulated latency
    setSigning(false);
    onSigned();
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

      <div className="flex justify-center">
        <PillButton onClick={handleSign}>
          {signing ? "Preparing…" : "Review & sign"}
        </PillButton>
      </div>
    </Card>
  );
}
