"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";
import type { DocumentRecord } from "@/lib/documents";

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted)]";

export function EditDocumentForm({
  document,
  companyName,
  backHref,
}: {
  document: DocumentRecord;
  companyName: string;
  backHref: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(document.title);
  const [content, setContent] = useState(document.contentMarkdown);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error" | "deleting">("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorDetail(null);

    const res = await fetch("/api/admin/update-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: document.id, title, contentMarkdown: content }),
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

  async function handleDelete() {
    if (!confirm(`Delete "${document.title}"? This can't be undone.`)) return;
    setStatus("deleting");
    setErrorDetail(null);

    const res = await fetch("/api/admin/delete-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: document.id }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorDetail([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }
    router.push(backHref);
  }

  return (
    <Card className="px-9 py-8">
      <p className="text-[13px] text-[var(--color-muted)] mb-1">
        {companyName} · {document.docType.toUpperCase()}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Content (Markdown)</label>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            className={`${inputClass} font-mono text-[12.5px]`}
          />
        </div>
        {status === "error" && <p className="text-[13px] text-[#a32d2d]">{errorDetail}</p>}
        {status === "saved" && <p className="text-[13px] text-[var(--color-ink)]">Saved.</p>}
        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={handleDelete}
            className="text-[13px] text-[#a32d2d] underline"
          >
            {status === "deleting" ? "Deleting…" : "Delete document"}
          </button>
          <PillButton type="submit">
            {status === "saving" ? "Saving…" : "Save"}
          </PillButton>
        </div>
      </form>
    </Card>
  );
}
