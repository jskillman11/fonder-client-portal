"use client";

import { useEffect, useState } from "react";
import { DocusealForm } from "@docuseal/react";
import { Card } from "@/components/Card";

export function SigningSession({
  clientSlug,
  docType,
  docLabel,
}: {
  clientSlug: string;
  docType: "sow" | "msa";
  docLabel: string;
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "complete" | "error">(
    "loading",
  );
  const [embedSrc, setEmbedSrc] = useState<string | null>(null);
  const [submitterEmail, setSubmitterEmail] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    // AbortController actually cancels the in-flight request on cleanup --
    // not just a `cancelled` flag guarding the state update after the fact.
    // Matters here specifically because this request has a real side effect
    // (creates a DocuSeal submission, resets sow/msa_signed_at) -- React's
    // dev-mode double-invoke of effects would otherwise fire it twice.
    const controller = new AbortController();

    async function startSigning() {
      try {
        const res = await fetch("/api/sign/create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientSlug, docType }),
          signal: controller.signal,
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

        setEmbedSrc(data.embedSrc);
        setSubmitterEmail(data.submitterEmail);
        setStatus("ready");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setStatus("error");
        setErrorDetail("Couldn't reach the signing service.");
      }
    }

    startSigning();
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "complete") {
    return (
      <Card className="px-9 py-16 text-center">
        <p className="text-[14px] text-[var(--color-ink)] font-semibold">
          You&apos;re all signed.
        </p>
        <p className="text-[13px] text-[var(--color-muted)] mt-1">
          Head back to the portal whenever you&apos;re ready.
        </p>
      </Card>
    );
  }

  if (status === "ready" && embedSrc) {
    return (
      <Card className="overflow-hidden">
        <DocusealForm
          src={embedSrc}
          email={submitterEmail ?? undefined}
          rememberSignature
          reuseSignature
          onComplete={() => setStatus("complete")}
        />
      </Card>
    );
  }

  return (
    <Card className="px-9 py-16 text-center">
      {status === "error" ? (
        <p className="text-[13px] text-[#a32d2d]">{errorDetail}</p>
      ) : (
        <p className="text-[14px] text-[var(--color-muted)]">
          Preparing your {docLabel}…
        </p>
      )}
    </Card>
  );
}
