"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PillButton } from "@/components/PillButton";
import type { DocumentRecord } from "@/lib/documents";

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted-text)]";

export function CompanyDocumentsInForceForm({
  companyId,
  documents,
  initialSowDocumentId,
  initialMsaDocumentId,
}: {
  companyId: string;
  documents: DocumentRecord[];
  initialSowDocumentId: string;
  initialMsaDocumentId: string;
}) {
  const router = useRouter();
  const [sowDocumentId, setSowDocumentId] = useState(initialSowDocumentId);
  const [msaDocumentId, setMsaDocumentId] = useState(initialMsaDocumentId);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const sowDocs = documents.filter((d) => d.docType === "sow");
  const msaDocs = documents.filter((d) => d.docType === "msa");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorDetail(null);

    const res = await fetch("/api/admin/update-company-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        sowDocumentId: sowDocumentId || null,
        msaDocumentId: msaDocumentId || null,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorDetail([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }

    setStatus("saved");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="text-[13px] text-[var(--color-muted-text)] mb-4">
        Which SOW and MSA are currently in force for this brand.
      </p>
      <div className="mb-4">
        <label className={labelClass}>SOW</label>
        <select
          value={sowDocumentId}
          onChange={(e) => setSowDocumentId(e.target.value)}
          className={inputClass}
        >
          <option value="">None selected</option>
          {sowDocs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>MSA</label>
        <select
          value={msaDocumentId}
          onChange={(e) => setMsaDocumentId(e.target.value)}
          className={inputClass}
        >
          <option value="">None selected</option>
          {msaDocs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </select>
      </div>

      {status === "error" && (
        <p className="text-[13px] text-[#a32d2d] mt-3">{errorDetail}</p>
      )}
      {status === "saved" && (
        <p className="text-[13px] text-[var(--color-ink)] mt-3">Saved.</p>
      )}

      <div className="flex justify-end mt-4">
        <PillButton type="submit">{status === "saving" ? "Saving…" : "Save changes"}</PillButton>
      </div>
    </form>
  );
}
