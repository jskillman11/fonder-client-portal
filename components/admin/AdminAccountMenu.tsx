"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminAccountMenu({ email }: { email: string }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-[13px] text-[var(--color-muted)]">{email}</span>
      <button
        onClick={handleSignOut}
        className="text-[13px] font-medium text-[var(--color-ink)] underline"
      >
        Sign out
      </button>
    </div>
  );
}
