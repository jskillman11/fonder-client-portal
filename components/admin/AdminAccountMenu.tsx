"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function AdminAccountMenu({ email }: { email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 text-[13px] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
      >
        <span>{email}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
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
          <div className="absolute right-0 top-full mt-2 z-40 w-44 rounded-[10px] border border-[var(--color-border)] bg-white shadow-lg py-1">
            <Link
              href="/admin/settings"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-[13px] text-[var(--color-ink)] hover:bg-[var(--color-cream)]"
            >
              Settings
            </Link>
            <Link
              href="/admin/help"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-[13px] text-[var(--color-ink)] hover:bg-[var(--color-cream)]"
            >
              Help
            </Link>
            <div className="my-1 border-t border-[var(--color-border)]" />
            <button
              type="button"
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-[13px] font-medium text-[var(--color-ink)] hover:bg-[var(--color-cream)]"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
