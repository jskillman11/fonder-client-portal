"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initialsFromName } from "@/lib/initials";
import { ICON_COLOR_PRESETS } from "@/lib/icon-color-presets";

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted-text)]";

export function EditProfileForm({
  userId,
  email,
  fullName,
  jobTitle,
  avatarUrl,
  iconBgColor,
  iconTextColor,
  canEdit = true,
}: {
  userId: string;
  email: string;
  fullName: string | null;
  jobTitle: string | null;
  avatarUrl: string | null;
  iconBgColor: string | null;
  iconTextColor: string | null;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(fullName ?? "");
  const [role, setRole] = useState(jobTitle ?? "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [colors, setColors] = useState<{ bg: string; text: string } | null>(
    iconBgColor && iconTextColor ? { bg: iconBgColor, text: iconTextColor } : null,
  );
  const [status, setStatus] = useState<"idle" | "saving">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("fullName", name);
    formData.append("jobTitle", role);
    if (colors) {
      formData.append("iconBgColor", colors.bg);
      formData.append("iconTextColor", colors.text);
    }
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

  if (!canEdit) {
    return (
      <Card className="px-9 py-8">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-12 w-12 rounded-lg after:rounded-lg">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name || email} className="rounded-lg object-cover" />}
            <AvatarFallback
              className="rounded-lg"
              style={{ backgroundColor: iconBgColor || "#f2f1ec", color: iconTextColor || "#181a1e" }}
            >
              {initialsFromName(name || email)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-[18px] font-bold text-[var(--color-ink)]">{name || email}</h1>
            {role && <p className="text-[13px] text-[var(--color-muted-text)]">{role}</p>}
          </div>
        </div>
        <p className="text-[13px] text-[var(--color-muted-text)]">{email}</p>
      </Card>
    );
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
              <AvatarFallback
                className="rounded-lg"
                style={{ backgroundColor: colors?.bg || "#f2f1ec", color: colors?.text || "#181a1e" }}
              >
                {initialsFromName(name || email)}
              </AvatarFallback>
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
        <div>
          <label className={labelClass}>Icon colors</label>
          <div className="flex gap-2 mt-1">
            {ICON_COLOR_PRESETS.map((preset) => {
              const isSelected = colors?.bg === preset.bg && colors?.text === preset.text;
              return (
                <button
                  key={preset.bg}
                  type="button"
                  onClick={() => setColors(preset)}
                  className={`w-9 h-9 rounded-[8px] flex items-center justify-center text-[11px] font-bold ${
                    isSelected ? "ring-2 ring-offset-2 ring-[var(--color-ink)]" : "border border-[var(--color-border)]"
                  }`}
                  style={{ backgroundColor: preset.bg, color: preset.text }}
                  title={`${preset.bg} / ${preset.text}`}
                >
                  Aa
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setColors(null)}
              className="w-9 h-9 rounded-[8px] border border-dashed border-[var(--color-border)] text-[11px] text-[var(--color-faint)]"
              title="Default"
            >
              ✕
            </button>
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
