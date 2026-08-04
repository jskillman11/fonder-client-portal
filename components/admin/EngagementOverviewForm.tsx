"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";
import type { Client } from "@/lib/companies-clients";
import type { EngagementStatus } from "@/lib/get-engagement";

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted)]";

export type EngagementOverviewValues = {
  clientId: string;
  engagementTitle: string;
  totalFee: string;
  totalFeeAmount: string;
  finalDeliveryDate: string;
  kickoffEarliestDate: string;
  scopeSummary: string;
  milestones: { label: string; date: string }[];
  status: EngagementStatus;
};

export function EngagementOverviewForm({
  engagementId,
  companyId,
  initialValues,
}: {
  engagementId: string;
  companyId: string;
  initialValues: EngagementOverviewValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/list-companies-clients")
      .then((res) => res.json())
      .then((data) => {
        setClients((data.clients ?? []).filter((c: Client) => c.companyId === companyId));
        setLoadingOptions(false);
      })
      .catch(() => setLoadingOptions(false));
  }, [companyId]);

  function set<K extends keyof EngagementOverviewValues>(
    key: K,
    value: EngagementOverviewValues[K],
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

    const [engagementRes, milestonesRes] = await Promise.all([
      fetch("/api/admin/update-engagement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engagementId,
          clientId: values.clientId,
          engagementTitle: values.engagementTitle,
          totalFee: values.totalFee,
          totalFeeAmount: values.totalFeeAmount,
          finalDeliveryDate: values.finalDeliveryDate,
          kickoffEarliestDate: values.kickoffEarliestDate,
          scopeSummary: values.scopeSummary,
        }),
      }),
      fetch("/api/admin/update-engagement-milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engagementId, milestones: values.milestones }),
      }),
    ]);

    if (!engagementRes.ok || !milestonesRes.ok) {
      const data = await (!engagementRes.ok ? engagementRes : milestonesRes).json();
      setStatus("error");
      setErrorDetail([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }

    setStatus("saved");
    router.refresh();
  }

  async function handleMarkCompleted() {
    if (!confirm("Mark this engagement as completed? This frees up the company to start a new one.")) {
      return;
    }
    setStatus("saving");
    setErrorDetail(null);

    const res = await fetch("/api/admin/update-engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ engagementId, status: "completed" }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorDetail([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }

    set("status", "completed");
    setStatus("saved");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Card className="px-9 py-9">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-bold text-[var(--color-ink)]">Client &amp; details</h2>
          {values.status === "active" ? (
            <button
              type="button"
              onClick={handleMarkCompleted}
              className="text-[12px] underline text-[var(--color-muted)]"
            >
              Mark as completed
            </button>
          ) : (
            <span className="text-[12px] text-[var(--color-muted)]">Completed</span>
          )}
        </div>

        <div className="mb-4">
          <label className={labelClass}>Client (signatory)</label>
          {loadingOptions ? (
            <p className="text-[13px] text-[var(--color-muted)] mt-1">Loading…</p>
          ) : (
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
          )}
        </div>

        <div className="mb-4">
          <label className={labelClass}>Engagement title</label>
          <input
            required
            value={values.engagementTitle}
            onChange={(e) => set("engagementTitle", e.target.value)}
            className={inputClass}
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
            />
          </div>
          <div>
            <label className={labelClass}>Final delivery date</label>
            <input
              required
              value={values.finalDeliveryDate}
              onChange={(e) => set("finalDeliveryDate", e.target.value)}
              className={inputClass}
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
        </div>
      </Card>

      <Card className="px-9 py-9">
        <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-1">Schedule</h2>
        <p className="text-[13px] text-[var(--color-muted)] mb-4">
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
