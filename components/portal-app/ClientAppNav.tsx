"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppUnlock } from "./AppUnlockContext";

const TABS = [
  { href: "", label: "Onboarding" },
  { href: "/home", label: "Home" },
  { href: "/tasks", label: "Tasks" },
  { href: "/resources", label: "Project Resources" },
  { href: "/chat", label: "Chat" },
  { href: "/invoices", label: "Invoices" },
  { href: "/deliverables", label: "Deliverables" },
  { href: "/documents", label: "Signed Documents" },
  { href: "/change-request", label: "Change Request" },
];

export function ClientAppNav({
  clientSlug,
  lockEnabled,
}: {
  clientSlug: string;
  lockEnabled: boolean;
}) {
  const pathname = usePathname();
  const { docsSent } = useAppUnlock();
  const base = `/portal/${clientSlug}/app`;

  return (
    <div className="overflow-x-auto -mx-4 px-4 mb-5">
      <div className="flex gap-2 w-max">
        {TABS.map((tab) => {
          const href = `${base}${tab.href}`;
          const isActive = pathname === href;
          const isOnboarding = tab.href === "";
          const isLocked = !isOnboarding && lockEnabled && !docsSent;

          if (isLocked) {
            return (
              <span
                key={tab.label}
                title="Unlocks once your documents are sent for signature."
                className="rounded-[var(--radius-pill)] px-4 py-2 text-[13px] font-medium whitespace-nowrap bg-white border border-[var(--color-border)] text-[var(--color-faint)] opacity-45 cursor-not-allowed"
              >
                {tab.label}
              </span>
            );
          }

          return (
            <Link
              key={tab.label}
              href={href}
              className={`rounded-[var(--radius-pill)] px-4 py-2 text-[13px] font-medium whitespace-nowrap ${
                isActive
                  ? "bg-[var(--color-ink)] text-white"
                  : "bg-white border border-[var(--color-border)] text-[var(--color-muted)]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
