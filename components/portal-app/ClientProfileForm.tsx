"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Client } from "@/lib/companies-clients";

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted)]";

export function ClientProfileForm({ client }: { client: Client }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(client.firstName);
  const [lastName, setLastName] = useState(client.lastName);
  const [email, setEmail] = useState(client.email);
  const [photo, setPhoto] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "saving">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");

    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("email", email);
    if (photo) formData.append("photo", photo);

    const res = await fetch("/api/portal/update-profile", { method: "POST", body: formData });
    const data = await res.json();
    setStatus("idle");

    if (!res.ok) {
      toast.error([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }
    toast.success("Saved.");
    router.refresh();
  }

  const displayName = `${firstName} ${lastName}`.trim() || email;

  return (
    <Card className="px-9 py-8">
      <h1 className="text-[18px] font-bold text-[var(--color-ink)] mb-4">Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Photo</label>
          <div className="flex items-center gap-3 mt-2">
            <Avatar className="h-12 w-12 rounded-lg after:rounded-lg">
              {client.avatarUrl && (
                <AvatarImage src={client.avatarUrl} alt={displayName} className="rounded-lg object-cover" />
              )}
              <AvatarFallback className="rounded-lg">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              className="text-[13px]"
            />
          </div>
        </div>
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
        <div className="flex justify-end pt-2">
          <PillButton type="submit">{status === "saving" ? "Saving…" : "Save"}</PillButton>
        </div>
      </form>
    </Card>
  );
}
