"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/companies", label: "Companies" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/documents", label: "Documents" },
  { href: "/admin/team", label: "Team" },
  { href: "/admin/content", label: "Portal content" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-[var(--color-border)] bg-white min-h-screen px-4 py-8">
      <div className="mb-8 px-2">
        <span className="text-[15px] font-bold text-[var(--color-ink)]">
          Fonder Admin
        </span>
      </div>
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
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
  );
}
