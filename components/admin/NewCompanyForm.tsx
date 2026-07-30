"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted)]";

export function NewCompanyForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorDetail(null);

    const formData = new FormData();
    formData.append("name", name);
    if (logo) formData.append("logo", logo);

    const res = await fetch("/api/admin/create-company", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorDetail([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }

    setName("");
    setLogo(null);
    setStatus("idle");
    router.refresh();
  }

  return (
    <Card className="px-9 py-7">
      <h2 className="text-[15px] font-bold text-[var(--color-ink)] mb-4">
        Add a company
      </h2>
      <form onSubmit={handleSubmit} className="flex gap-3 items-end flex-wrap">
        <div className="flex-1 min-w-[160px]">
          <label className={labelClass}>Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Coros"
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className={labelClass}>Logo (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
            className="w-full mt-1 text-[13px]"
          />
        </div>
        <PillButton type="submit">
          {status === "saving" ? "Adding…" : "Add"}
        </PillButton>
      </form>
      {status === "error" && (
        <p className="text-[13px] text-[#a32d2d] mt-3">{errorDetail}</p>
      )}
    </Card>
  );
}
