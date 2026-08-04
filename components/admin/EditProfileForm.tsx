"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted)]";

export function EditProfileForm({
  email,
  fullName,
  jobTitle,
  avatarUrl,
}: {
  email: string;
  fullName: string | null;
  jobTitle: string | null;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(fullName ?? "");
  const [role, setRole] = useState(jobTitle ?? "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "saving">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");

    const formData = new FormData();
    formData.append("fullName", name);
    formData.append("jobTitle", role);
    if (photo) formData.append("photo", photo);

    const res = await fetch("/api/admin/update-profile", { method: "POST", body: formData });
    const data = await res.json();
    setStatus("idle");

    if (!res.ok) {
      toast.error([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }
    toast.success("Saved.");
    router.refresh();
  }

  return (
    <Card className="px-9 py-8">
      <h1 className="text-[18px] font-bold text-[var(--color-ink)] mb-4">Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Photo</label>
          <div className="flex items-center gap-3 mt-2">
            <Avatar className="h-12 w-12 rounded-lg after:rounded-lg">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={name || email} className="rounded-lg object-cover" />}
              <AvatarFallback className="rounded-lg">{(name || email).charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              className="text-[13px]"
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Your name"
          />
        </div>
        <div>
          <label className={labelClass}>Role</label>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={inputClass}
            placeholder="Global Brand Design Lead"
          />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <p className="text-[14px] text-[var(--color-muted)] mt-1">{email}</p>
        </div>
        <div className="flex justify-end pt-2">
          <PillButton type="submit">{status === "saving" ? "Saving…" : "Save"}</PillButton>
        </div>
      </form>
    </Card>
  );
}
