"use client";

import { useEffect, useState } from "react";
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
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function startSigning() {
      try {
        const res = await fetch("/api/sign/create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientSlug, docType }),
        });
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setStatus("error");
          setErrorDetail(
            [data.error, data.detail].filter(Boolean).join(" — ") ||
              "Something went wrong.",
          );
          return;
        }

        setEmbedUrl(`${data.documensoUrl}/embed/sign/${data.embedToken}`);
        setStatus("ready");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setErrorDetail("Couldn't reach the signing service.");
        }
      }
    }

    startSigning();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "ready" && embedUrl) {
    return (
      <Card className="overflow-hidden">
        <iframe
          src={embedUrl}
          className="w-full"
          style={{ height: "80vh", border: "none" }}
          title={`Sign ${docLabel}`}
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
