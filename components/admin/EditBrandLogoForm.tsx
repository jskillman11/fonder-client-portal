"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function EditBrandLogoForm({ logoUrl }: { logoUrl: string | null }) {
  const router = useRouter();
  const [logo, setLogo] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "removing">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!logo) return;
    setStatus("saving");

    const formData = new FormData();
    formData.append("logo", logo);

    const res = await fetch("/api/admin/update-brand-logo", { method: "POST", body: formData });
    const data = await res.json();
    setStatus("idle");

    if (!res.ok) {
      toast.error([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }
    toast.success("Saved.");
    setLogo(null);
    router.refresh();
  }

  async function handleRemoveLogo() {
    setStatus("removing");

    const formData = new FormData();
    formData.append("removeLogo", "true");

    const res = await fetch("/api/admin/update-brand-logo", { method: "POST", body: formData });
    const data = await res.json();
    setStatus("idle");

    if (!res.ok) {
      toast.error([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }
    toast.success("Logo removed.");
    router.refresh();
  }

  return (
    <Card className="px-9 py-8">
      <h2 className="text-[15px] font-bold text-[var(--color-ink)] mb-1">Brand logo</h2>
      <p className="text-[13px] text-[var(--color-muted-text)] mb-4">
        Shown in the admin sidebar (when no brand is selected) and on the staff login page.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {logoUrl && (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 rounded-lg after:rounded-lg">
              <AvatarImage src={logoUrl} alt="Fonder" className="rounded-lg object-cover" />
              <AvatarFallback className="rounded-lg">F</AvatarFallback>
            </Avatar>
            <p className="text-[12px] text-[var(--color-muted-text)]">Current logo</p>
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="text-[12px] text-[#a32d2d] underline ml-auto"
            >
              {status === "removing" ? "Removing…" : "Remove logo"}
            </button>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
          className="w-full text-[13px]"
        />
        <div className="flex justify-end pt-2">
          <PillButton type="submit">{status === "saving" ? "Saving…" : "Save"}</PillButton>
        </div>
      </form>
    </Card>
  );
}
