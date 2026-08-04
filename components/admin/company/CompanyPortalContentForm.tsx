"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PillButton } from "@/components/PillButton";
import { PORTAL_APP_TABS, type TabLockState } from "@/lib/portal-app-tabs";

export function CompanyPortalContentForm({
  companyId,
  initialLockPortalTabs,
  initialTabLockOverrides,
}: {
  companyId: string;
  initialLockPortalTabs: boolean;
  initialTabLockOverrides: Record<string, TabLockState>;
}) {
  const router = useRouter();
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
      body: JSON.stringify({ companyId, lockPortalTabs, tabLockOverrides }),
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
    <form onSubmit={handleSubmit}>
      <p className="text-[13px] text-[var(--color-muted)] mb-4">
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
        <p className="text-[13px] font-medium text-[var(--color-muted)]">Per-tab overrides</p>
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

      {status === "error" && (
        <p className="text-[13px] text-[#a32d2d] mt-3">{errorDetail}</p>
      )}
      {status === "saved" && (
        <p className="text-[13px] text-[var(--color-ink)] mt-3">Saved.</p>
      )}

      <div className="flex justify-end mt-4">
        <PillButton type="submit">{status === "saving" ? "Saving…" : "Save changes"}</PillButton>
      </div>
    </form>
  );
}
