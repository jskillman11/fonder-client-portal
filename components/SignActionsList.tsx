"use client";

import { useState } from "react";

type DocStatus = "idle" | "sending" | "sent" | "error";

export function SignActionsList({
  clientSlug,
  hasSow,
  hasMsa,
  sowLabel,
  sowDescription,
  msaLabel,
  msaDescription,
}: {
  clientSlug: string;
  hasSow: boolean;
  hasMsa: boolean;
  sowLabel: string;
  sowDescription: string;
  msaLabel: string;
  msaDescription: string;
}) {
  const docs = [
    hasSow && { key: "sow" as const, label: sowLabel, description: sowDescription },
    hasMsa && { key: "msa" as const, label: msaLabel, description: msaDescription },
  ].filter(Boolean) as { key: "sow" | "msa"; label: string; description: string }[];

  const [statuses, setStatuses] = useState<Record<string, DocStatus>>({});
  const [errorDetails, setErrorDetails] = useState<Record<string, string>>({});

  async function handleClick(docType: "sow" | "msa") {
    setStatuses((prev) => ({ ...prev, [docType]: "sending" }));

    try {
      const res = await fetch("/api/sign/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientSlug, docType }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatuses((prev) => ({ ...prev, [docType]: "error" }));
        setErrorDetails((prev) => ({
          ...prev,
          [docType]: [data.error, data.detail].filter(Boolean).join(" — ") || "Something went wrong.",
        }));
        return;
      }

      setStatuses((prev) => ({ ...prev, [docType]: "sent" }));
    } catch {
      setStatuses((prev) => ({ ...prev, [docType]: "error" }));
      setErrorDetails((prev) => ({ ...prev, [docType]: "Couldn't reach the signing service." }));
    }
  }

  return (
    <div className="space-y-3 mt-3">
      {docs.map((doc) => {
        const status = statuses[doc.key] ?? "idle";
        return (
          <div
            key={doc.key}
            className="flex items-center justify-between rounded-[14px] border border-[var(--color-border)] px-5 py-4"
          >
            <div>
              <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">
                {doc.label}
              </p>
              <p className="text-[13px] text-[var(--color-muted)] mt-0.5">
                {doc.description}
              </p>
              {status === "error" && (
                <p className="text-[12px] text-[#a32d2d] mt-1">{errorDetails[doc.key]}</p>
              )}
            </div>
            <button
              onClick={() => handleClick(doc.key)}
              disabled={status === "sending" || status === "sent"}
              className={`rounded-[var(--radius-pill)] text-[13px] font-semibold px-5 py-2.5 whitespace-nowrap ml-4 ${
                status === "sent"
                  ? "bg-[var(--color-cream)] text-[var(--color-ink)] border border-[var(--color-border)]"
                  : "bg-[var(--color-ink)] text-white"
              }`}
            >
              {status === "sending"
                ? "Sending…"
                : status === "sent"
                  ? "Email sent"
                  : status === "error"
                    ? "Try again"
                    : "Review & sign"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
