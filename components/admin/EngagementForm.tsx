"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";

type TeamMemberInput = {
  name: string;
  role: string;
  blurb: string;
  iconBgColor: string;
  iconTextColor: string;
};

export type EngagementFormValues = {
  clientSlug: string;
  clientName: string;
  engagementTitle: string;
  totalFee: string;
  finalDeliveryDate: string;
  clientSignatoryFirstName: string;
  clientSignatoryLastName: string;
  clientSignatoryEmail: string;
  sowContentMarkdown: string;
  msaContentMarkdown: string;
  team: TeamMemberInput[];
};

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted)]";

export function EngagementForm({
  mode,
  initialValues,
  existingLogoUrl,
}: {
  mode: "create" | "edit";
  initialValues?: EngagementFormValues;
  existingLogoUrl?: string | null;
}) {
  const router = useRouter();
  const defaults: EngagementFormValues = initialValues ?? {
    clientSlug: "",
    clientName: "",
    engagementTitle: "",
    totalFee: "",
    finalDeliveryDate: "",
    clientSignatoryFirstName: "",
    clientSignatoryLastName: "",
    clientSignatoryEmail: "",
    sowContentMarkdown: "",
    msaContentMarkdown: "",
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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

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

    const formData = new FormData();
    formData.append("engagement", JSON.stringify(values));
    if (logoFile) formData.append("logo", logoFile);

    const res = await fetch("/api/admin/create-engagement", {
      method: "POST",
      body: formData,
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

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-[19px] font-bold text-[var(--color-ink)]">
        {mode === "create"
          ? "New client engagement"
          : `Editing ${values.clientName || "client"}`}
      </h1>

      {/* --- Client & Company --- */}
      <Card className="px-9 py-9">
        <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-4">
          Client &amp; company
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass}>Company name</label>
            <input
              required
              value={values.clientName}
              onChange={(e) => set("clientName", e.target.value)}
              className={inputClass}
              placeholder="Coros"
            />
          </div>
          <div>
            <label className={labelClass}>
              Portal slug (used in the link)
            </label>
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
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass}>Signatory first name</label>
            <input
              required
              value={values.clientSignatoryFirstName}
              onChange={(e) => set("clientSignatoryFirstName", e.target.value)}
              className={inputClass}
              placeholder="Jamie"
            />
            <p className="text-[11px] text-[var(--color-faint)] mt-1">
              Used for the portal greeting: &quot;Welcome to Fonder, Jamie&quot;
            </p>
          </div>
          <div>
            <label className={labelClass}>Signatory last name</label>
            <input
              required
              value={values.clientSignatoryLastName}
              onChange={(e) => set("clientSignatoryLastName", e.target.value)}
              className={inputClass}
              placeholder="Rivera"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className={labelClass}>Signatory email</label>
          <input
            required
            type="email"
            value={values.clientSignatoryEmail}
            onChange={(e) => set("clientSignatoryEmail", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Client logo (shown alongside the Fonder logo on their portal)
          </label>
          {existingLogoUrl && (
            <div className="flex items-center gap-2 mt-2 mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={existingLogoUrl}
                alt="Current logo"
                className="h-8 w-auto max-w-[100px] object-contain"
              />
              <p className="text-[12px] text-[var(--color-muted)]">
                Current logo — only upload a new one if it needs to change.
              </p>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            className="w-full mt-1 text-[13px]"
          />
          <p className="text-[11px] text-[var(--color-faint)] mt-1">
            Optional — the portal still works fine without one.
          </p>
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
        <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-1">
          Document content
        </h2>
        <p className="text-[13px] text-[var(--color-muted)] mb-4">
          Paste the finalized SOW and MSA content, in Markdown — this is
          rendered directly on the client&apos;s portal page, and a PDF is
          generated automatically from this same content once they sign. No
          separate file to prepare or upload.
        </p>
        <div className="mb-4">
          <label className={labelClass}>SOW content</label>
          <textarea
            required={mode === "create"}
            value={values.sowContentMarkdown}
            onChange={(e) => set("sowContentMarkdown", e.target.value)}
            rows={10}
            className={`${inputClass} font-mono text-[12.5px]`}
            placeholder={"## 1. Engagement Overview\n\nThis Statement of Work..."}
          />
        </div>
        <div>
          <label className={labelClass}>MSA content</label>
          <textarea
            required={mode === "create"}
            value={values.msaContentMarkdown}
            onChange={(e) => set("msaContentMarkdown", e.target.value)}
            rows={10}
            className={`${inputClass} font-mono text-[12.5px]`}
            placeholder={"## 1. Master Services Agreement\n\nThis Agreement..."}
          />
        </div>
      </Card>

      {/* --- Account team --- */}
      <Card className="px-9 py-9">
        <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-1">
          Account team
        </h2>
        <p className="text-[13px] text-[var(--color-muted)] mb-4">
          Icon colors are optional — leave blank to use the default cream
          background with ink text.
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
                Icon background
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={member.iconBgColor || "#f2f1ec"}
                  onChange={(e) =>
                    updateTeamMember(i, "iconBgColor", e.target.value)
                  }
                  className="h-9 w-9 rounded-[8px] border border-[var(--color-border)] cursor-pointer"
                />
                <input
                  value={member.iconBgColor}
                  onChange={(e) =>
                    updateTeamMember(i, "iconBgColor", e.target.value)
                  }
                  placeholder="default"
                  className={`${inputClass} mt-0`}
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-[var(--color-faint)]">
                Icon text color
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={member.iconTextColor || "#181a1e"}
                  onChange={(e) =>
                    updateTeamMember(i, "iconTextColor", e.target.value)
                  }
                  className="h-9 w-9 rounded-[8px] border border-[var(--color-border)] cursor-pointer"
                />
                <input
                  value={member.iconTextColor}
                  onChange={(e) =>
                    updateTeamMember(i, "iconTextColor", e.target.value)
                  }
                  placeholder="default"
                  className={`${inputClass} mt-0`}
                />
              </div>
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
