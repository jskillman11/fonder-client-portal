"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";
import type { Client } from "@/lib/companies-clients";

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted)]";

export function EditClientForm({
  client,
  companyName,
}: {
  client: Client;
  companyName: string;
}) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(client.firstName);
  const [lastName, setLastName] = useState(client.lastName);
  const [email, setEmail] = useState(client.email);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error" | "deleting">("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorDetail(null);

    const res = await fetch("/api/admin/update-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: client.id, firstName, lastName, email }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorDetail([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }
    setStatus("saved");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Delete ${client.firstName} ${client.lastName}? This can't be undone.`)) return;
    setStatus("deleting");
    setErrorDetail(null);

    const res = await fetch("/api/admin/delete-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: client.id }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorDetail([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }
    router.push("/admin/clients");
  }

  return (
    <Card className="px-9 py-8">
      <h1 className="text-[18px] font-bold text-[var(--color-ink)] mb-1">
        {client.firstName} {client.lastName}
      </h1>
      <p className="text-[13px] text-[var(--color-muted)] mb-4">{companyName}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>First name</label>
            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Last name</label>
            <input
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        {status === "error" && <p className="text-[13px] text-[#a32d2d]">{errorDetail}</p>}
        {status === "saved" && <p className="text-[13px] text-[var(--color-ink)]">Saved.</p>}
        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={handleDelete}
            className="text-[13px] text-[#a32d2d] underline"
          >
            {status === "deleting" ? "Deleting…" : "Delete client"}
          </button>
          <PillButton type="submit">
            {status === "saving" ? "Saving…" : "Save"}
          </PillButton>
        </div>
      </form>
    </Card>
  );
}
