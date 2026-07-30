"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";
import type { Company } from "@/lib/companies-clients";

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted)]";

export function EditCompanyForm({ company }: { company: Company }) {
  const router = useRouter();
  const [name, setName] = useState(company.name);
  const [logo, setLogo] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error" | "deleting">("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorDetail(null);

    const formData = new FormData();
    formData.append("id", company.id);
    formData.append("name", name);
    if (logo) formData.append("logo", logo);

    const res = await fetch("/api/admin/update-company", { method: "POST", body: formData });
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
    if (!confirm(`Delete ${company.name}? This also deletes its clients and documents. This can't be undone.`)) return;
    setStatus("deleting");
    setErrorDetail(null);

    const res = await fetch("/api/admin/delete-company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: company.id }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorDetail([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }
    router.push("/admin/companies");
  }

  return (
    <Card className="px-9 py-8">
      <h1 className="text-[18px] font-bold text-[var(--color-ink)] mb-4">
        {company.name}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Logo</label>
          {company.logoUrl && (
            <div className="flex items-center gap-2 mt-2 mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={company.logoUrl} alt={company.name} className="h-8 w-auto max-w-[100px] object-contain" />
              <p className="text-[12px] text-[var(--color-muted)]">Current logo — upload a new one to replace it.</p>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
            className="w-full mt-1 text-[13px]"
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
            {status === "deleting" ? "Deleting…" : "Delete company"}
          </button>
          <PillButton type="submit">
            {status === "saving" ? "Saving…" : "Save"}
          </PillButton>
        </div>
      </form>
    </Card>
  );
}
