"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";
import type { DocumentRecord } from "@/lib/documents";

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted)]";

export function EngagementDocumentsForm({
  engagementId,
  companyId,
  initialSowDocumentId,
  initialMsaDocumentId,
}: {
  engagementId: string;
  companyId: string;
  initialSowDocumentId: string;
  initialMsaDocumentId: string;
}) {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [sowDocumentId, setSowDocumentId] = useState(initialSowDocumentId);
  const [msaDocumentId, setMsaDocumentId] = useState(initialMsaDocumentId);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/list-documents")
      .then((res) => res.json())
      .then((data) => {
        setDocuments((data.documents ?? []).filter((d: DocumentRecord) => d.companyId === companyId));
        setLoadingOptions(false);
      })
      .catch(() => setLoadingOptions(false));
  }, [companyId]);

  const sowDocs = documents.filter((d) => d.docType === "sow");
  const msaDocs = documents.filter((d) => d.docType === "msa");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorDetail(null);

    const res = await fetch("/api/admin/update-engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ engagementId, sowDocumentId, msaDocumentId }),
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <Card className="px-9 py-9">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[16px] font-bold text-[var(--color-ink)]">Documents</h2>
          <Link
            href={`/admin/companies/${companyId}`}
            target="_blank"
            className="text-[12px] underline text-[var(--color-muted)]"
          >
            + New document
          </Link>
        </div>
        <p className="text-[13px] text-[var(--color-muted)] mb-4">
          Select the SOW and MSA to use for this engagement, from this company&apos;s document
          pool.
        </p>

        {loadingOptions ? (
          <p className="text-[13px] text-[var(--color-muted)]">Loading…</p>
        ) : (
          <>
            <div className="mb-4">
              <label className={labelClass}>SOW</label>
              <select
                required
                value={sowDocumentId}
                onChange={(e) => setSowDocumentId(e.target.value)}
                className={inputClass}
              >
                <option value="" disabled>
                  Select a SOW…
                </option>
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
                required
                value={msaDocumentId}
                onChange={(e) => setMsaDocumentId(e.target.value)}
                className={inputClass}
              >
                <option value="" disabled>
                  Select an MSA…
                </option>
                {msaDocs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </Card>

      {status === "error" && (
        <p className="text-[13px] text-center text-[#a32d2d]">{errorDetail}</p>
      )}
      {status === "saved" && (
        <p className="text-[13px] text-center text-[var(--color-ink)]">Saved.</p>
      )}

      <div className="flex justify-center">
        <PillButton type="submit">{status === "saving" ? "Saving…" : "Save changes"}</PillButton>
      </div>
    </form>
  );
}
