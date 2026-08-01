"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";
import type { Company, Client } from "@/lib/companies-clients";
import type { DocumentRecord } from "@/lib/documents";
import type { TeamMemberRecord } from "@/lib/team-members";
import { PORTAL_APP_TABS, type TabLockState } from "@/lib/portal-app-tabs";

export type EngagementFormValues = {
  clientSlug: string;
  companyId: string;
  clientId: string;
  sowDocumentId: string;
  msaDocumentId: string;
  engagementTitle: string;
  totalFee: string;
  finalDeliveryDate: string;
  kickoffEarliestDate: string;
  scopeSummary: string;
  milestones: { label: string; date: string }[];
  teamMemberIds: string[];
  lockPortalTabs: boolean;
  sharedDriveUrl: string;
  tabLockOverrides: Record<string, TabLockState>;
};

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted)]";

export function EngagementForm({
  mode,
  initialValues,
  initialCompanyName,
}: {
  mode: "create" | "edit";
  initialValues?: EngagementFormValues;
  initialCompanyName?: string;
}) {
  const router = useRouter();
  const defaults: EngagementFormValues = initialValues ?? {
    clientSlug: "",
    companyId: "",
    clientId: "",
    sowDocumentId: "",
    msaDocumentId: "",
    engagementTitle: "",
    totalFee: "",
    finalDeliveryDate: "",
    kickoffEarliestDate: "",
    scopeSummary: "",
    milestones: [],
    teamMemberIds: [],
    lockPortalTabs: true,
    sharedDriveUrl: "",
    tabLockOverrides: {},
  };

  const [values, setValues] = useState<EngagementFormValues>(defaults);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberRecord[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/list-companies-clients").then((res) => res.json()),
      fetch("/api/admin/list-documents").then((res) => res.json()),
      fetch("/api/admin/list-team-members").then((res) => res.json()),
    ])
      .then(([ccData, docData, teamData]) => {
        setCompanies(ccData.companies ?? []);
        setClients(ccData.clients ?? []);
        setDocuments(docData.documents ?? []);
        setTeamMembers(teamData.teamMembers ?? []);
        setLoadingOptions(false);
      })
      .catch(() => setLoadingOptions(false));
  }, []);

  function set<K extends keyof EngagementFormValues>(
    key: K,
    value: EngagementFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function toggleTeamMember(id: string) {
    set(
      "teamMemberIds",
      values.teamMemberIds.includes(id)
        ? values.teamMemberIds.filter((existing) => existing !== id)
        : [...values.teamMemberIds, id],
    );
  }

  function setTabOverride(tabKey: string, value: TabLockState | "default") {
    const next = { ...values.tabLockOverrides };
    if (value === "default") {
      delete next[tabKey];
    } else {
      next[tabKey] = value;
    }
    set("tabLockOverrides", next);
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
      body: JSON.stringify(values),
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

  if (status === "done") {
    return (
      <Card className="px-9 py-10 text-center max-w-lg mx-auto">
        <h1 className="text-[20px] font-bold text-[var(--color-ink)] mb-3">
          {mode === "create" ? "Client created" : "Changes saved"}
        </h1>
        <p className="text-[14px] text-[var(--color-muted)] mb-5">
          Portal link:{" "}
          <a
            href={`/portal/${values.clientSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--color-ink)] underline"
          >
            /portal/{values.clientSlug}
          </a>
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => router.push("/admin")}
            className="text-[13px] font-medium text-[var(--color-ink)] underline"
          >
            Back to all clients
          </button>
        </div>
      </Card>
    );
  }

  const clientsForCompany = clients.filter((c) => c.companyId === values.companyId);
  const sowDocsForCompany = documents.filter(
    (d) => d.companyId === values.companyId && d.docType === "sow",
  );
  const msaDocsForCompany = documents.filter(
    (d) => d.companyId === values.companyId && d.docType === "msa",
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-[19px] font-bold text-[var(--color-ink)]">
        {mode === "create"
          ? "New client engagement"
          : `Editing ${initialCompanyName || "client"}`}
      </h1>

      {/* --- Client & Company --- */}
      <Card className="px-9 py-9">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-bold text-[var(--color-ink)]">
            Client &amp; company
          </h2>
          <div className="flex gap-3 text-[12px]">
            <Link href="/admin/companies" target="_blank" className="underline text-[var(--color-muted)]">
              + New company
            </Link>
            <Link href="/admin/clients" target="_blank" className="underline text-[var(--color-muted)]">
              + New client
            </Link>
          </div>
        </div>

        {loadingOptions ? (
          <p className="text-[13px] text-[var(--color-muted)]">Loading…</p>
        ) : (
          <>
            <div className="mb-4">
              <label className={labelClass}>Company</label>
              <select
                required
                value={values.companyId}
                onChange={(e) => set("companyId", e.target.value)}
                className={inputClass}
              >
                <option value="" disabled>
                  Select a company…
                </option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {companies.length === 0 && (
                <p className="text-[11px] text-[var(--color-faint)] mt-1">
                  No companies yet — add one via the &quot;+ New company&quot; link above, then
                  come back and refresh.
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className={labelClass}>Client (signatory)</label>
              <select
                required
                value={values.clientId}
                onChange={(e) => set("clientId", e.target.value)}
                disabled={!values.companyId}
                className={`${inputClass} ${!values.companyId ? "opacity-60" : ""}`}
              >
                <option value="" disabled>
                  {values.companyId ? "Select a client…" : "Select a company first"}
                </option>
                {clientsForCompany.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.email})
                  </option>
                ))}
              </select>
              {values.companyId && clientsForCompany.length === 0 && (
                <p className="text-[11px] text-[var(--color-faint)] mt-1">
                  No clients yet for this company — add one via the &quot;+ New
                  client&quot; link above, then come back and refresh.
                </p>
              )}
            </div>
          </>
        )}

        <div>
          <label className={labelClass}>Portal slug (used in the link)</label>
          <input
            required
            disabled={mode === "edit"}
            value={values.clientSlug}
            onChange={(e) => set("clientSlug", e.target.value)}
            className={`${inputClass} ${mode === "edit" ? "opacity-60" : ""}`}
            placeholder="coros"
          />
          {mode === "edit" && (
            <p className="text-[11px] text-[var(--color-faint)] mt-1">
              Slug can&apos;t be changed after creation — it&apos;s the
              client&apos;s live link. Create a new client instead if it
              needs to change.
            </p>
          )}
        </div>
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

      {/* --- Document content --- */}
      <Card className="px-9 py-9">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[16px] font-bold text-[var(--color-ink)]">
            Documents
          </h2>
          <Link href="/admin/documents" target="_blank" className="text-[12px] underline text-[var(--color-muted)]">
            + New document
          </Link>
        </div>
        <p className="text-[13px] text-[var(--color-muted)] mb-4">
          Select the SOW and MSA to use for this engagement — managed on the
          Documents page, scoped to the selected company above.
        </p>
        <div className="mb-4">
          <label className={labelClass}>SOW</label>
          <select
            required={mode === "create"}
            value={values.sowDocumentId}
            onChange={(e) => set("sowDocumentId", e.target.value)}
            disabled={!values.companyId}
            className={`${inputClass} ${!values.companyId ? "opacity-60" : ""}`}
          >
            <option value="" disabled>
              {values.companyId ? "Select a SOW…" : "Select a company first"}
            </option>
            {sowDocsForCompany.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>MSA</label>
          <select
            required={mode === "create"}
            value={values.msaDocumentId}
            onChange={(e) => set("msaDocumentId", e.target.value)}
            disabled={!values.companyId}
            className={`${inputClass} ${!values.companyId ? "opacity-60" : ""}`}
          >
            <option value="" disabled>
              {values.companyId ? "Select an MSA…" : "Select a company first"}
            </option>
            {msaDocsForCompany.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* --- Account team --- */}
      <Card className="px-9 py-9">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[16px] font-bold text-[var(--color-ink)]">
            Account team
          </h2>
          <Link href="/admin/team" target="_blank" className="text-[12px] underline text-[var(--color-muted)]">
            + New team member
          </Link>
        </div>
        <p className="text-[13px] text-[var(--color-muted)] mb-4">
          Select who&apos;s shown on this client&apos;s portal — managed on
          the Team page.
        </p>
        {teamMembers.length === 0 ? (
          <p className="text-[13px] text-[var(--color-muted)]">
            No team members yet — add some via the &quot;+ New team
            member&quot; link above.
          </p>
        ) : (
          <div className="space-y-2">
            {teamMembers.map((t) => {
              const isChecked = values.teamMemberIds.includes(t.id);
              return (
                <label
                  key={t.id}
                  className="flex items-center gap-3 rounded-[10px] border border-[var(--color-border)] px-4 py-2.5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleTeamMember(t.id)}
                    className="w-4 h-4"
                  />
                  <div
                    className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[10px] font-semibold shrink-0"
                    style={{
                      backgroundColor: t.iconBgColor || "#f2f1ec",
                      color: t.iconTextColor || "#181a1e",
                    }}
                  >
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-[13.5px] font-semibold text-[var(--color-ink)]">
                      {t.name}
                    </p>
                    <p className="text-[12px] text-[var(--color-muted)]">{t.role}</p>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </Card>

      {/* --- Client portal --- */}
      <Card className="px-9 py-9">
        <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-1">
          Client portal
        </h2>
        <p className="text-[13px] text-[var(--color-muted)] mb-4">
          Controls whether the client portal app's tabs (Tasks, Chat,
          Invoices, etc.) stay locked until both documents are sent for
          signature.
        </p>
        <label className="flex items-center gap-3 rounded-[10px] border border-[var(--color-border)] px-4 py-2.5 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={values.lockPortalTabs}
            onChange={(e) => set("lockPortalTabs", e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-[13.5px] font-medium text-[var(--color-ink)]">
            Lock portal tabs until documents are sent
          </span>
        </label>

        <div className="mt-5">
          <label className={labelClass}>Shared Drive URL</label>
          <input
            type="url"
            value={values.sharedDriveUrl}
            onChange={(e) => set("sharedDriveUrl", e.target.value)}
            className={inputClass}
            placeholder="https://drive.google.com/drive/folders/..."
          />
        </div>

        <div className="mt-5">
          <p className={labelClass}>Per-tab overrides</p>
          <p className="text-[11px] text-[var(--color-faint)] mt-1 mb-2">
            Overrides the lock above for a specific tab, regardless of
            whether documents have been sent yet.
          </p>
          <div className="space-y-2">
            {PORTAL_APP_TABS.map((tab) => (
              <div
                key={tab.key}
                className="flex items-center justify-between rounded-[10px] border border-[var(--color-border)] px-4 py-2.5"
              >
                <span className="text-[13.5px] font-medium text-[var(--color-ink)]">
                  {tab.label}
                </span>
                <select
                  value={values.tabLockOverrides[tab.key] ?? "default"}
                  onChange={(e) =>
                    setTabOverride(tab.key, e.target.value as TabLockState | "default")
                  }
                  className="rounded-[8px] border border-[var(--color-border)] text-[13px] px-2 py-1.5"
                >
                  <option value="default">Default (locked until signed)</option>
                  <option value="locked">Always locked</option>
                  <option value="unlocked">Always unlocked</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {status === "error" && (
        <p className="text-[13px] text-center text-[#a32d2d]">
          {errorDetail}
        </p>
      )}

      <div className="flex justify-center">
        <PillButton type="submit">
          {status === "saving"
            ? "Saving…"
            : mode === "create"
              ? "Create client"
              : "Save changes"}
        </PillButton>
      </div>
    </form>
  );
}
