"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";
import type { Client } from "@/lib/companies-clients";

export type EngagementFormValues = {
  clientId: string;
  clientSlug: string;
  engagementTitle: string;
  totalFee: string;
  totalFeeAmount: string;
  finalDeliveryDate: string;
  kickoffEarliestDate: string;
  scopeSummary: string;
  milestones: { label: string; date: string }[];
};

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted-text)]";

export function EngagementForm({
  lockedCompanyId,
  lockedCompanyName,
  hasCompanySlug,
  existingClientSlug,
  backHref = "/admin/companies",
}: {
  lockedCompanyId: string;
  lockedCompanyName: string;
  hasCompanySlug: boolean;
  existingClientSlug: string | null;
  backHref?: string;
}) {
  const router = useRouter();
  const defaults: EngagementFormValues = {
    clientId: "",
    clientSlug: "",
    engagementTitle: "",
    totalFee: "",
    totalFeeAmount: "",
    finalDeliveryDate: "",
    kickoffEarliestDate: "",
    scopeSummary: "",
    milestones: [],
  };

  const [values, setValues] = useState<EngagementFormValues>(defaults);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/list-companies-clients")
      .then((res) => res.json())
      .then((data) => {
        setClients((data.clients ?? []).filter((c: Client) => c.companyId === lockedCompanyId));
        setLoadingOptions(false);
      })
      .catch(() => setLoadingOptions(false));
  }, [lockedCompanyId]);

  function set<K extends keyof EngagementFormValues>(
    key: K,
    value: EngagementFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function updateMilestone(index: number, field: "label" | "date", value: string) {
    set(
      "milestones",
      values.milestones.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
  }

  function addMilestone() {
    set("milestones", [...values.milestones, { label: "", date: "" }]);
  }

  function removeMilestone(index: number) {
    set(
      "milestones",
      values.milestones.filter((_, i) => i !== index),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorDetail(null);

    const res = await fetch("/api/admin/create-engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId: lockedCompanyId,
        clientId: values.clientId,
        engagementTitle: values.engagementTitle,
        totalFee: values.totalFee,
        totalFeeAmount: values.totalFeeAmount,
        finalDeliveryDate: values.finalDeliveryDate,
        kickoffEarliestDate: values.kickoffEarliestDate,
        scopeSummary: values.scopeSummary,
        milestones: values.milestones,
        ...(hasCompanySlug ? {} : { clientSlug: values.clientSlug }),
      }),
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
    setStatus("done");
  }

  const portalSlug = existingClientSlug ?? values.clientSlug;

  if (status === "done") {
    return (
      <Card className="px-9 py-10 text-center max-w-lg mx-auto">
        <h1 className="text-[20px] font-bold text-[var(--color-ink)] mb-3">
          Engagement created
        </h1>
        <p className="text-[14px] text-[var(--color-muted-text)] mb-5">
          Portal link:{" "}
          <a
            href={`/portal/${portalSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--color-ink)] underline"
          >
            /portal/{portalSlug}
          </a>
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => router.push(backHref)}
            className="text-[13px] font-medium text-[var(--color-ink)] underline"
          >
            Back to all clients
          </button>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-[19px] font-bold text-[var(--color-ink)]">
        New engagement
      </h1>

      {/* --- Client & Company --- */}
      <Card className="px-9 py-9">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-bold text-[var(--color-ink)]">
            Client &amp; company
          </h2>
          <Link
            href={`/admin/companies/${lockedCompanyId}`}
            target="_blank"
            className="text-[12px] underline text-[var(--color-muted-text)]"
          >
            + New client
          </Link>
        </div>

        <div className="mb-4">
          <label className={labelClass}>Company</label>
          <p className="text-[14px] font-semibold text-[var(--color-ink)] mt-1">
            {lockedCompanyName}
          </p>
        </div>

        {loadingOptions ? (
          <p className="text-[13px] text-[var(--color-muted-text)]">Loading…</p>
        ) : (
          <div className="mb-4">
            <label className={labelClass}>Client (signatory)</label>
            <select
              required
              value={values.clientId}
              onChange={(e) => set("clientId", e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>
                Select a client…
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.email})
                </option>
              ))}
            </select>
            {clients.length === 0 && (
              <p className="text-[11px] text-[var(--color-faint)] mt-1">
                No clients yet for this company — add one via the &quot;+ New
                client&quot; link above, then come back and refresh.
              </p>
            )}
          </div>
        )}

        {!hasCompanySlug && (
          <div>
            <label className={labelClass}>Portal slug (used in the link)</label>
            <input
              required
              value={values.clientSlug}
              onChange={(e) => set("clientSlug", e.target.value)}
              className={inputClass}
              placeholder="coros"
            />
            <p className="text-[11px] text-[var(--color-faint)] mt-1">
              This is the client&apos;s portal link for this company — it stays the same across
              any future engagements, so choose it once, carefully.
            </p>
          </div>
        )}
      </Card>

      {/* --- Engagement Details --- */}
      <Card className="px-9 py-9">
        <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-4">
          Engagement details
        </h2>

        <div className="mb-4">
          <label className={labelClass}>Engagement title</label>
          <input
            required
            value={values.engagementTitle}
            onChange={(e) => set("engagementTitle", e.target.value)}
            className={inputClass}
            placeholder="Dura 2 Software Storytelling System"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Total fee</label>
            <input
              required
              value={values.totalFee}
              onChange={(e) => set("totalFee", e.target.value)}
              className={inputClass}
              placeholder="$12,000"
            />
          </div>
          <div>
            <label className={labelClass}>Final delivery date</label>
            <input
              required
              value={values.finalDeliveryDate}
              onChange={(e) => set("finalDeliveryDate", e.target.value)}
              className={inputClass}
              placeholder="August 30, 2026"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className={labelClass}>Total fee (numeric, for invoicing)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={values.totalFeeAmount}
            onChange={(e) => set("totalFeeAmount", e.target.value)}
            className={inputClass}
            placeholder="12000.00"
          />
          <p className="text-[11px] text-[var(--color-faint)] mt-1">
            Used to create the real QuickBooks invoice — separate from the display text above.
          </p>
        </div>

        <div className="mt-4">
          <label className={labelClass}>Scope summary</label>
          <textarea
            value={values.scopeSummary}
            onChange={(e) => set("scopeSummary", e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="A short, high-level description of what this engagement covers — shown in the portal's Overview section, separate from the full SOW."
          />
        </div>

        <div className="mt-4">
          <label className={labelClass}>Kickoff earliest date</label>
          <input
            type="date"
            value={values.kickoffEarliestDate}
            onChange={(e) => set("kickoffEarliestDate", e.target.value)}
            className={inputClass}
          />
          <p className="text-[11px] text-[var(--color-faint)] mt-1">
            Opens the scheduling calendar to this month by default — doesn&apos;t block earlier
            dates from being picked, just controls the starting view.
          </p>
        </div>
      </Card>

      {/* --- Schedule --- */}
      <Card className="px-9 py-9">
        <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-1">
          Schedule
        </h2>
        <p className="text-[13px] text-[var(--color-muted-text)] mb-4">
          Start date, deliverable dates, and any other milestones — shown in the portal&apos;s
          Overview section.
        </p>
        {values.milestones.map((m, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-3 mb-3 items-end">
            <div>
              <label className={labelClass}>Label</label>
              <input
                value={m.label}
                onChange={(e) => updateMilestone(i, "label", e.target.value)}
                className={inputClass}
                placeholder="Project start"
              />
            </div>
            <div>
              <label className={labelClass}>Date</label>
              <input
                type="date"
                value={m.date}
                onChange={(e) => updateMilestone(i, "date", e.target.value)}
                className={inputClass}
              />
            </div>
            <button
              type="button"
              onClick={() => removeMilestone(i)}
              className="text-[12px] text-[#a32d2d] underline mb-2.5"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addMilestone}
          className="text-[13px] font-medium text-[var(--color-ink)] underline"
        >
          + Add milestone
        </button>
      </Card>

      {status === "error" && (
        <p className="text-[13px] text-center text-[#a32d2d]">
          {errorDetail}
        </p>
      )}

      <div className="flex justify-center">
        <PillButton type="submit">
          {status === "saving" ? "Saving…" : "Create engagement"}
        </PillButton>
      </div>
    </form>
  );
}
