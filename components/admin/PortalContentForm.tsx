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
    heading: "Overview section",
    fields: [
      { key: "overview_heading", label: "Heading" },
      { key: "overview_subheading", label: "Subheading" },
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
      { key: "whats_next_step_1_title", label: "Step 1 title (Review & sign)" },
      { key: "whats_next_step_1_body", label: "Step 1 body", multiline: true },
      { key: "whats_next_step_2_title", label: "Step 2 title (Invoice & deposit)" },
      { key: "whats_next_step_2_body", label: "Step 2 body", multiline: true },
      { key: "whats_next_step_3_title", label: "Step 3 title (Schedule kickoff)" },
      { key: "whats_next_step_3_body", label: "Step 3 body", multiline: true },
      { key: "whats_next_step_4_title", label: "Step 4 title (Client portal)" },
      { key: "whats_next_step_4_body", label: "Step 4 body", multiline: true },
      { key: "sow_label", label: "SOW label" },
      { key: "sow_description", label: "SOW description" },
      { key: "msa_label", label: "MSA label" },
      { key: "msa_description", label: "MSA description" },
    ],
  },
];

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted-text)]";

export function PortalContentForm() {
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
      <div>
        <h2 className="text-[15px] font-bold text-[var(--color-ink)] mb-1">Portal content</h2>
        <p className="text-[13px] text-[var(--color-muted-text)]">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-[15px] font-bold text-[var(--color-ink)] mb-1">Portal content</h2>
      <p className="text-[13px] text-[var(--color-muted-text)] mb-3">
        Edit once — applies to every client&apos;s portal immediately.
      </p>

      <div className="space-y-3">
        {FIELD_GROUPS.map((group) => (
          <Card key={group.heading} className="px-9 py-8">
            <h3 className="text-[15px] font-bold text-[var(--color-ink)] mb-4">
              {group.heading}
            </h3>
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
      </div>

      {status === "error" && (
        <p className="text-[13px] text-center text-[#a32d2d] mt-3">{errorDetail}</p>
      )}
      {status === "saved" && (
        <p className="text-[13px] text-center text-[var(--color-ink)] mt-3">
          Saved — every client&apos;s portal now uses this copy.
        </p>
      )}

      <div className="flex justify-center mt-4">
        <PillButton onClick={handleSave}>
          {status === "saving" ? "Saving…" : "Save changes"}
        </PillButton>
      </div>
    </div>
  );
}
