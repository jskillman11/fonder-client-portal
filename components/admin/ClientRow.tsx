"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function ClientRow({
  client,
  companyId,
  access,
}: {
  client: { id: string; firstName: string; lastName: string; email: string; companyName: string };
  companyId: string;
  access?: { hasAccess: boolean; lastSignInAt: string | null };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function handleRevoke() {
    if (
      !confirm(
        `Revoke ${client.firstName} ${client.lastName}'s portal access? They'll need a fresh access link to get back in.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setErrorDetail(null);

    const res = await fetch("/api/admin/revoke-client-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: client.id }),
    });
    const data = await res.json();

    setBusy(false);
    if (!res.ok) {
      setErrorDetail(data.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="py-3 border-b border-[var(--color-border)] last:border-b-0 -mx-7 px-7 hover:bg-[var(--color-cream)]">
      <div className="flex items-center justify-between gap-4">
        <Link href={`/admin/companies/${companyId}/clients/${client.id}`} className="flex-1 min-w-0">
          <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">
            {client.firstName} {client.lastName}
          </p>
          <p className="text-[13px] text-[var(--color-muted)]">
            {client.companyName} · {client.email}
          </p>
          {access && (
            <p className="text-[12px] text-[var(--color-faint)] mt-0.5">
              {access.hasAccess
                ? access.lastSignInAt
                  ? `Active · last signed in ${new Date(access.lastSignInAt).toLocaleDateString()}`
                  : "Invited, not yet signed in"
                : "Not yet provisioned"}
            </p>
          )}
        </Link>
        {access?.hasAccess && (
          <button
            type="button"
            disabled={busy}
            onClick={handleRevoke}
            className="text-[13px] font-medium text-[#a32d2d] underline disabled:opacity-50 shrink-0"
          >
            Revoke access
          </button>
        )}
      </div>
      {errorDetail && <p className="text-[12px] text-[#a32d2d] mt-2">{errorDetail}</p>}
    </div>
  );
}
