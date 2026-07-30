"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";
import { PORTAL_COPY_DEFAULTS, PortalCopyKey } from "@/lib/portal-copy-constants";

const FIELD_GROUPS: { heading: string; fields: { key: PortalCopyKey; label: string; multiline?: boolean }[] }[] = [
  {
    heading: "Welcome section",
    fields: [
      { key: "welcome_greeting", label: "Greeting (use {{clientFirstName}} for the client's first name)" },
      { key: "welcome_subtitle", label: "Subtitle (use {{engagementTitle}} for the engagement name)", multiline: true },
    ],
  },
  {
    heading: "Team section",
    fields: [
      { key: "team_heading", label: "Heading" },
      { key: "team_subheading", label: "Subheading" },
    ],
  },
  {
    heading: "What's next section",
    fields: [
      { key: "whats_next_heading", label: "Heading" },
      { key: "whats_next_subheading", label: "Subheading" },
      { key: "whats_next_step_1_title", label: "Step 1 title" },
      { key: "whats_next_step_1_body", label: "Step 1 body", multiline: true },
      { key: "whats_next_step_2_title", label: "Step 2 title" },
      { key: "whats_next_step_2_body", label: "Step 2 body", multiline: true },
      { key: "whats_next_step_3_title", label: "Step 3 title" },
      { key: "whats_next_step_3_body", label: "Step 3 body", multiline: true },
    ],
  },
  {
    heading: "Review & sign section",
    fields: [
      { key: "review_sign_heading", label: "Heading" },
      { key: "review_sign_subheading", label: "Subheading" },
      { key: "sow_label", label: "SOW label" },
      { key: "sow_description", label: "SOW description" },
      { key: "msa_label", label: "MSA label" },
      { key: "msa_description", label: "MSA description" },
    ],
  },
];

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted)]";

export default function PortalContentPage() {
  const [values, setValues] = useState<Record<string, string>>(PORTAL_COPY_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/get-portal-copy")
      .then((res) => res.json())
      .then((data) => {
        setValues(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setStatus("saving");
    setErrorDetail(null);
    const res = await fetch("/api/admin/save-portal-copy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus("error");
      setErrorDetail(data.error || "Something went wrong.");
      return;
    }
    setStatus("saved");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--color-cream)] py-12 px-4">
        <p className="text-center text-[14px] text-[var(--color-muted)]">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-cream)] py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="text-[20px] font-bold text-[var(--color-ink)]">
            Portal content
          </h1>
          <p className="text-[13px] text-[var(--color-muted)] mt-1">
            Edit once — applies to every client's portal immediately.
          </p>
        </div>

        {FIELD_GROUPS.map((group) => (
          <Card key={group.heading} className="px-9 py-8">
            <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-4">
              {group.heading}
            </h2>
            {group.fields.map((field) => (
              <div key={field.key} className="mb-4 last:mb-0">
                <label className={labelClass}>{field.label}</label>
                {field.multiline ? (
                  <textarea
                    value={values[field.key] ?? ""}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    rows={3}
                    className={inputClass}
                  />
                ) : (
                  <input
                    value={values[field.key] ?? ""}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    className={inputClass}
                  />
                )}
              </div>
            ))}
          </Card>
        ))}

        {status === "error" && (
          <p className="text-[13px] text-center text-[#a32d2d]">{errorDetail}</p>
        )}
        {status === "saved" && (
          <p className="text-[13px] text-center text-[var(--color-ink)]">
            Saved — every client's portal now uses this copy.
          </p>
        )}

        <div className="flex justify-center pb-8">
          <PillButton onClick={handleSave}>
            {status === "saving" ? "Saving…" : "Save changes"}
          </PillButton>
        </div>
      </div>
    </main>
  );
}
