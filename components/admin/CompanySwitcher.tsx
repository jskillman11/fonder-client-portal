"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Company } from "@/lib/companies-clients";

export function CompanySwitcher({
  companies,
  activeCompany,
}: {
  companies: Company[];
  activeCompany: Company | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center gap-2 rounded-[10px] border border-[var(--color-border)] px-3 py-2 hover:bg-[var(--color-cream)]"
      >
        {activeCompany?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeCompany.logoUrl}
            alt={activeCompany.name}
            className="h-5 w-auto max-w-[60px] object-contain shrink-0"
          />
        ) : (
          <div className="h-5 w-5 rounded bg-[var(--color-cream)] border border-[var(--color-border)] shrink-0" />
        )}
        <span className="flex-1 min-w-0 text-left truncate text-[13.5px] font-semibold text-[var(--color-ink)]">
          {activeCompany?.name ?? "All Brands"}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
          <path
            d="M2 3.5L5 6.5L8 3.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 right-0 top-full mt-1 z-40 max-h-80 overflow-y-auto rounded-[10px] border border-[var(--color-border)] bg-white shadow-lg py-1">
            <button
              type="button"
              onClick={() => go("/admin/companies")}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-cream)]"
            >
              <div className="h-5 w-5 shrink-0" />
              <span className="text-[13.5px] font-medium text-[var(--color-ink)]">
                All Brands
              </span>
            </button>
            {companies.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => go(`/admin/companies/${c.id}`)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-cream)]"
              >
                {c.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.logoUrl}
                    alt={c.name}
                    className="h-5 w-auto max-w-[60px] object-contain shrink-0"
                  />
                ) : (
                  <div className="h-5 w-5 rounded bg-[var(--color-cream)] border border-[var(--color-border)] shrink-0" />
                )}
                <span className="text-[13.5px] font-medium text-[var(--color-ink)] truncate">
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
