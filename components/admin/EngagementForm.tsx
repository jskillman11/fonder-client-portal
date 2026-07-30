"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";
import type { Company, Client } from "@/lib/companies-clients";
import type { DocumentRecord } from "@/lib/documents";

type TeamMemberInput = {
  name: string;
  role: string;
  blurb: string;
  iconBgColor: string;
  iconTextColor: string;
};

export type EngagementFormValues = {
  clientSlug: string;
  companyId: string;
  clientId: string;
  sowDocumentId: string;
  msaDocumentId: string;
  engagementTitle: string;
  totalFee: string;
  finalDeliveryDate: string;
  team: TeamMemberInput[];
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
    team: [
      {
        name: "Tom Abrams",
        role: "Founder, Creative Director",
        blurb: "",
        iconBgColor: "",
        iconTextColor: "",
      },
    ],
  };

  const [values, setValues] = useState<EngagementFormValues>(defaults);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/list-companies-clients").then((res) => res.json()),
      fetch("/api/admin/list-documents").then((res) => res.json()),
    ])
      .then(([ccData, docData]) => {
        setCompanies(ccData.companies ?? []);
        setClients(ccData.clients ?? []);
        setDocuments(docData.documents ?? []);
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

  function updateTeamMember(
    index: number,
    field: keyof TeamMemberInput,
    value: string,
  ) {
    set(
      "team",
      values.team.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
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
        <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-1">
          Account team
        </h2>
        <p className="text-[13px] text-[var(--color-muted)] mb-4">
          Icon colors are optional hex values — leave blank to use the
          default cream background with ink text.
        </p>
        {values.team.map((member, i) => (
          <div
            key={i}
            className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-[var(--color-border)] last:border-b-0"
          >
            <input
              value={member.name}
              onChange={(e) => updateTeamMember(i, "name", e.target.value)}
              className={inputClass}
              placeholder="Name"
            />
            <input
              value={member.role}
              onChange={(e) => updateTeamMember(i, "role", e.target.value)}
              className={inputClass}
              placeholder="Role"
            />
            <div>
              <label className="text-[11px] text-[var(--color-faint)]">
                Icon background (hex)
              </label>
              <input
                value={member.iconBgColor}
                onChange={(e) =>
                  updateTeamMember(i, "iconBgColor", e.target.value)
                }
                placeholder="#f2f1ec (default)"
                pattern="^#?[0-9A-Fa-f]{6}$"
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label className="text-[11px] text-[var(--color-faint)]">
                Icon text color (hex)
              </label>
              <input
                value={member.iconTextColor}
                onChange={(e) =>
                  updateTeamMember(i, "iconTextColor", e.target.value)
                }
                placeholder="#181a1e (default)"
                pattern="^#?[0-9A-Fa-f]{6}$"
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            set("team", [
              ...values.team,
              { name: "", role: "", blurb: "", iconBgColor: "", iconTextColor: "" },
            ])
          }
          className="text-[13px] font-medium text-[var(--color-ink)] underline"
        >
          + Add team member
        </button>
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
