"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type ShellNavItem = {
  href: string;
  label: string;
  locked?: boolean;
  // Optional section header shown above this item when it differs from the
  // previous item's section -- omit entirely for an ungrouped, flat nav.
  section?: string;
};

export function DashboardShell({
  navItems,
  accountSlot,
  children,
}: {
  navItems: ShellNavItem[];
  accountSlot: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Auto-close the mobile drawer whenever a navigation completes -- adjusting
  // state during render (rather than in an effect) on a prop/derived-value
  // change, per React's recommended pattern for this.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileNavOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-cream)]">
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`w-56 shrink-0 border-r border-[var(--color-border)] bg-white overflow-y-auto px-4 py-8 fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 px-2 flex items-center justify-between">
          <Image
            src="/fonder-logo.png"
            alt="Fonder"
            width={140}
            height={32}
            className="h-8 w-auto"
          />
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu"
            className="md:hidden -mr-1 p-1 text-[var(--color-muted)]"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M2 2L16 16M16 2L2 16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <nav className="space-y-1">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href;
            const showSectionHeader = item.section && item.section !== navItems[index - 1]?.section;

            return (
              <Fragment key={item.href}>
                {showSectionHeader && (
                  <p className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-faint)] first:pt-0">
                    {item.section}
                  </p>
                )}
                {item.locked ? (
                  <span
                    title="Unlocks once your documents are sent for signature."
                    className="block rounded-[10px] px-3 py-2 text-[13.5px] font-medium text-[var(--color-faint)] opacity-45 cursor-not-allowed"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className={`block rounded-[10px] px-3 py-2 text-[13.5px] font-medium ${
                      isActive
                        ? "bg-[var(--color-cream)] text-[var(--color-ink)]"
                        : "text-[var(--color-muted)] hover:bg-[var(--color-cream)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                )}
              </Fragment>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="flex items-center justify-between md:justify-end border-b border-[var(--color-border)] bg-white px-4 md:px-6 py-3">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            className="md:hidden p-1 -ml-1 text-[var(--color-ink)]"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 5.5H17M3 10H17M3 14.5H17"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          {accountSlot}
        </header>
        <main className="flex-1 px-4 py-8">{children}</main>
      </div>
    </div>
  );
}
