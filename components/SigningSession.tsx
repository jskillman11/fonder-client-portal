"use client";

import { useState } from "react";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";
import { DocumentContent } from "@/components/DocumentContent";

export function SigningSession({
  clientSlug,
  docType,
  docLabel,
  markdown,
}: {
  clientSlug: string;
  docType: "sow" | "msa";
  docLabel: string;
  markdown: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function startSigning() {
    setStatus("loading");
    setErrorDetail(null);

    try {
      const res = await fetch("/api/sign/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientSlug, docType }),
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

      setEmbedUrl(`${data.documensoUrl}/embed/sign/${data.embedToken}`);
      setStatus("ready");
    } catch {
      setStatus("error");
      setErrorDetail("Couldn't reach the signing service.");
    }
  }

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
    <div className="space-y-5">
      <DocumentContent title={docLabel} markdown={markdown} />

      <Card className="px-9 py-8 text-center">
        {status === "error" && (
          <p className="text-[13px] text-[#a32d2d] mb-4">{errorDetail}</p>
        )}
        <PillButton onClick={startSigning}>
          {status === "loading" ? "Preparing…" : `Sign the ${docLabel}`}
        </PillButton>
      </Card>
    </div>
  );
}
