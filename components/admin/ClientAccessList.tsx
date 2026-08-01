"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ClientAccessRecord } from "@/lib/client-access";

export function ClientAccessList({ clients }: { clients: ClientAccessRecord[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function handleRevoke(clientId: string, email: string) {
    if (!confirm(`Revoke ${email}'s portal access? They'll need a fresh access link to get back in.`)) {
      return;
    }
    setBusyId(clientId);
    setErrorDetail(null);

    const res = await fetch("/api/admin/revoke-client-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    });
    const data = await res.json();

    setBusyId(null);
    if (!res.ok) {
      setErrorDetail(data.error);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {clients.map((c) => (
        <div
          key={c.clientId}
          className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-b-0"
        >
          <div>
            <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">
              {c.firstName} {c.lastName}
            </p>
            <p className="text-[13px] text-[var(--color-muted)]">
              {c.companyName} · {c.email}
            </p>
            <p className="text-[12px] text-[var(--color-faint)] mt-0.5">
              {c.hasAccess
                ? c.lastSignInAt
                  ? `Active · last signed in ${new Date(c.lastSignInAt).toLocaleDateString()}`
                  : "Invited, not yet signed in"
                : "Not yet provisioned"}
            </p>
          </div>
          {c.hasAccess && (
            <button
              type="button"
              disabled={busyId === c.clientId}
              onClick={() => handleRevoke(c.clientId, c.email)}
              className="text-[13px] font-medium text-[#a32d2d] underline disabled:opacity-50"
            >
              Revoke access
            </button>
          )}
        </div>
      ))}
      {errorDetail && <p className="text-[13px] text-[#a32d2d] mt-3">{errorDetail}</p>}
    </div>
  );
}
