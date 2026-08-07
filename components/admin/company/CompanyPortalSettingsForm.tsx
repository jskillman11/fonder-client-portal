"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";
import { PORTAL_APP_TABS, type TabLockState } from "@/lib/portal-app-tabs";

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted-text)]";

export function CompanyPortalSettingsForm({
  companyId,
  initialSharedDriveUrl,
  initialLockPortalTabs,
  initialTabLockOverrides,
}: {
  companyId: string;
  initialSharedDriveUrl: string;
  initialLockPortalTabs: boolean;
  initialTabLockOverrides: Record<string, TabLockState>;
}) {
  const router = useRouter();
  const [sharedDriveUrl, setSharedDriveUrl] = useState(initialSharedDriveUrl);
  const [lockPortalTabs, setLockPortalTabs] = useState(initialLockPortalTabs);
  const [tabLockOverrides, setTabLockOverrides] = useState(initialTabLockOverrides);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  function setTabOverride(tabKey: string, value: TabLockState | "default") {
    setTabLockOverrides((prev) => {
      const next = { ...prev };
      if (value === "default") {
        delete next[tabKey];
      } else {
        next[tabKey] = value;
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorDetail(null);

    const res = await fetch("/api/admin/update-company-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, sharedDriveUrl, lockPortalTabs, tabLockOverrides }),
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
        <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-4">Shared Drive</h2>
        <p className="text-[13px] text-[var(--color-muted-text)] mb-3">
          Where the client&apos;s Shared Drive tab redirects to.
        </p>
        <div>
          <label className={labelClass}>Shared Drive URL</label>
          <input
            type="url"
            value={sharedDriveUrl}
            onChange={(e) => setSharedDriveUrl(e.target.value)}
            className={inputClass}
            placeholder="https://drive.google.com/drive/folders/..."
          />
        </div>
      </Card>

      <Card className="px-9 py-8">
        <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-4">Portal content &amp; locks</h2>
        <p className="text-[13px] text-[var(--color-muted-text)] mb-4">
          Controls whether the client portal app&apos;s tabs (Tasks, Chat, Invoices, etc.) stay
          locked until both documents are sent for signature.
        </p>
        <label className="flex items-center gap-3 rounded-[10px] border border-[var(--color-border)] px-4 py-2.5 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={lockPortalTabs}
            onChange={(e) => setLockPortalTabs(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-[13.5px] font-medium text-[var(--color-ink)]">
            Lock portal tabs until documents are sent
          </span>
        </label>

        <div className="mt-5">
          <p className="text-[13px] font-medium text-[var(--color-muted-text)]">Per-tab overrides</p>
          <p className="text-[11px] text-[var(--color-faint)] mt-1 mb-2">
            Overrides the lock above for a specific tab, regardless of whether documents have been
            sent yet. Home isn&apos;t listed here — onboarding lives there, so it&apos;s always
            unlocked.
          </p>
          <div className="space-y-2">
            {PORTAL_APP_TABS.filter((tab) => tab.key !== "home").map((tab) => (
              <div
                key={tab.key}
                className="flex items-center justify-between rounded-[10px] border border-[var(--color-border)] px-4 py-2.5"
              >
                <span className="text-[13.5px] font-medium text-[var(--color-ink)]">
                  {tab.label}
                </span>
                <select
                  value={tabLockOverrides[tab.key] ?? "default"}
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
