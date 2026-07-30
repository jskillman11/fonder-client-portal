"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";
import type { Company } from "@/lib/companies-clients";

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted)]";

export function NewDocumentForm({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [docType, setDocType] = useState<"sow" | "msa">("sow");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorDetail(null);

    const res = await fetch("/api/admin/create-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, docType, title, contentMarkdown: content }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorDetail([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }

    setTitle("");
    setContent("");
    setStatus("idle");
    router.refresh();
  }

  if (companies.length === 0) {
    return (
      <Card className="px-9 py-7">
        <p className="text-[14px] text-[var(--color-muted)]">
          Add a company first before adding documents.
        </p>
      </Card>
    );
  }

  return (
    <Card className="px-9 py-7">
      <h2 className="text-[15px] font-bold text-[var(--color-ink)] mb-4">
        Add a document
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Company</label>
            <select
              required
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className={inputClass}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as "sow" | "msa")}
              className={inputClass}
            >
              <option value="sow">SOW</option>
              <option value="msa">MSA</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="Dura 2 Software Storytelling System — SOW"
          />
        </div>
        <div>
          <label className={labelClass}>Content (Markdown)</label>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className={`${inputClass} font-mono text-[12.5px]`}
            placeholder={"## 1. Engagement Overview\n\n..."}
          />
        </div>
        <div className="flex justify-end">
          <PillButton type="submit">
            {status === "saving" ? "Adding…" : "Add"}
          </PillButton>
        </div>
      </form>
      {status === "error" && (
        <p className="text-[13px] text-[#a32d2d] mt-3">{errorDetail}</p>
      )}
    </Card>
  );
}
