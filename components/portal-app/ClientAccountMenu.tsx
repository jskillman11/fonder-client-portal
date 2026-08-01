"use client";

import { useRouter } from "next/navigation";

export function ClientAccountMenu({
  clientSlug,
  hasSession,
  isAdmin,
  clientName,
}: {
  clientSlug: string;
  hasSession: boolean;
  isAdmin: boolean;
  clientName: string;
}) {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/portal/sign-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientSlug }),
    });
    router.push(`/portal/${clientSlug}`);
  }

  if (hasSession) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-[13px] text-[var(--color-muted)]">{clientName}</span>
        <button
          onClick={handleSignOut}
          className="text-[13px] font-medium text-[var(--color-ink)] underline"
        >
          Sign out
        </button>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-[13px] text-[var(--color-muted)]">Viewing as admin</span>
        <a
          href="/admin"
          className="text-[13px] font-medium text-[var(--color-ink)] underline"
        >
          Back to admin
        </a>
      </div>
    );
  }

  return null;
}
