"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type ShellNavItem = {
  href: string;
  label: string;
  locked?: boolean;
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

  return (
    <div className="flex min-h-screen bg-[var(--color-cream)]">
      <aside className="w-56 shrink-0 border-r border-[var(--color-border)] bg-white sticky top-0 h-screen overflow-y-auto px-4 py-8">
        <div className="mb-8 px-2">
          <Image
            src="/fonder-logo.png"
            alt="Fonder"
            width={140}
            height={32}
            className="h-8 w-auto"
          />
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            if (item.locked) {
              return (
                <span
                  key={item.href}
                  title="Unlocks once your documents are sent for signature."
                  className="block rounded-[10px] px-3 py-2 text-[13.5px] font-medium text-[var(--color-faint)] opacity-45 cursor-not-allowed"
                >
                  {item.label}
                </span>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-[10px] px-3 py-2 text-[13.5px] font-medium ${
                  isActive
                    ? "bg-[var(--color-cream)] text-[var(--color-ink)]"
                    : "text-[var(--color-muted)] hover:bg-[var(--color-cream)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="flex justify-end items-center border-b border-[var(--color-border)] bg-white px-6 py-3">
          {accountSlot}
        </header>
        <main className="flex-1 px-4 py-8">{children}</main>
      </div>
    </div>
  );
}
