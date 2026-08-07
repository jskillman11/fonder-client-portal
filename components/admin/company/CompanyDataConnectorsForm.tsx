"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";
import type { Company } from "@/lib/companies-clients";

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted-text)]";

export function CompanyDataConnectorsForm({ company }: { company: Company }) {
  const router = useRouter();
  const [clickupListIds, setClickupListIds] = useState(company.clickupListIds.join("\n"));
  const [googleSheetIds, setGoogleSheetIds] = useState(company.googleSheetIds.join("\n"));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorDetail(null);

    const res = await fetch("/api/admin/update-company-connectors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId: company.id, clickupListIds, googleSheetIds }),
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
      <Card className="px-9 py-8">
        <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-1">QuickBooks</h2>
        <p className="text-[13px] text-[var(--color-muted-text)]">
          {company.qbCustomerId ? (
            <>
              Linked customer ID: <span className="font-mono">{company.qbCustomerId}</span>
            </>
          ) : (
            "Not linked yet — created automatically the first time an invoice is sent to this company."
          )}
        </p>
      </Card>

      <Card className="px-9 py-8">
        <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-1">ClickUp</h2>
        <p className="text-[11px] text-[var(--color-faint)] mb-3">
          IDs only, for now — nothing syncs to ClickUp yet.
        </p>
        <label className={labelClass}>List ID(s)</label>
        <textarea
          value={clickupListIds}
          onChange={(e) => setClickupListIds(e.target.value)}
          rows={2}
          className={inputClass}
          placeholder="One per line"
        />
      </Card>

      <Card className="px-9 py-8">
        <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-1">Google</h2>
        <p className="text-[11px] text-[var(--color-faint)] mb-3">
          IDs only, for now — nothing syncs to Google Sheets yet.
        </p>
        <label className={labelClass}>Sheet ID(s)</label>
        <textarea
          value={googleSheetIds}
          onChange={(e) => setGoogleSheetIds(e.target.value)}
          rows={2}
          className={inputClass}
          placeholder="One per line"
        />
      </Card>

      {status === "error" && (
        <p className="text-[13px] text-[#a32d2d]">{errorDetail}</p>
      )}
      {status === "saved" && (
        <p className="text-[13px] text-[var(--color-ink)]">Saved.</p>
      )}

      <div className="flex justify-end">
        <PillButton type="submit">{status === "saving" ? "Saving…" : "Save changes"}</PillButton>
      </div>
    </form>
  );
}
