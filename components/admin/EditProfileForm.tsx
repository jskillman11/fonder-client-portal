"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initialsFromName } from "@/lib/initials";

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted-text)]";

export function EditProfileForm({
  email,
  fullName,
  jobTitle,
  avatarUrl,
  iconBgColor,
  iconTextColor,
}: {
  email: string;
  fullName: string | null;
  jobTitle: string | null;
  avatarUrl: string | null;
  iconBgColor: string | null;
  iconTextColor: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(fullName ?? "");
  const [role, setRole] = useState(jobTitle ?? "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [bgColor, setBgColor] = useState(iconBgColor ?? "#f2f1ec");
  const [textColor, setTextColor] = useState(iconTextColor ?? "#181a1e");
  const [status, setStatus] = useState<"idle" | "saving">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");

    const formData = new FormData();
    formData.append("fullName", name);
    formData.append("jobTitle", role);
    formData.append("iconBgColor", bgColor);
    formData.append("iconTextColor", textColor);
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
              <AvatarFallback className="rounded-lg">{initialsFromName(name || email)}</AvatarFallback>
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
          <p className="text-[12px] text-[var(--color-muted-text)] mt-1">
            Also shown on client portals if you&apos;re on a company&apos;s account team roster.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className={labelClass}>Icon background</label>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="h-7 w-10 rounded border border-[var(--color-border)] p-0.5"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className={labelClass}>Icon text</label>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="h-7 w-10 rounded border border-[var(--color-border)] p-0.5"
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <p className="text-[14px] text-[var(--color-muted-text)] mt-1">{email}</p>
        </div>
        <div className="flex justify-end pt-2">
          <PillButton type="submit">{status === "saving" ? "Saving…" : "Save"}</PillButton>
        </div>
      </form>
    </Card>
  );
}
