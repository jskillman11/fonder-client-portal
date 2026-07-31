"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "", label: "Home" },
  { href: "/tasks", label: "Tasks" },
  { href: "/resources", label: "Project Resources" },
  { href: "/chat", label: "Chat" },
  { href: "/invoices", label: "Invoices" },
  { href: "/deliverables", label: "Deliverables" },
  { href: "/documents", label: "Signed Documents" },
  { href: "/change-request", label: "Change Request" },
];

export function ClientAppNav({ clientSlug }: { clientSlug: string }) {
  const pathname = usePathname();
  const base = `/portal/${clientSlug}/app`;

  return (
    <div className="overflow-x-auto -mx-4 px-4 mb-5">
      <div className="flex gap-2 w-max">
        {TABS.map((tab) => {
          const href = `${base}${tab.href}`;
          const isActive = pathname === href;
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
