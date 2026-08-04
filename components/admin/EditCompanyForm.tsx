"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Company } from "@/lib/companies-clients";

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted)]";

export function EditCompanyForm({ company }: { company: Company }) {
  const router = useRouter();
  const [name, setName] = useState(company.name);
  const [logo, setLogo] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "deleting">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");

    const formData = new FormData();
    formData.append("id", company.id);
    formData.append("name", name);
    if (logo) formData.append("logo", logo);

    const res = await fetch("/api/admin/update-company", { method: "POST", body: formData });
    const data = await res.json();
    setStatus("idle");

    if (!res.ok) {
      toast.error([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }
    toast.success("Saved.");
    router.refresh();
  }

  async function handleDelete() {
    setStatus("deleting");

    const res = await fetch("/api/admin/delete-company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: company.id }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("idle");
      toast.error([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }
    router.push("/admin/companies");
  }

  return (
    <Card className="px-9 py-8">
      <h1 className="text-[18px] font-bold text-[var(--color-ink)] mb-4">
        {company.name}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Logo</label>
          {company.logoUrl && (
            <div className="flex items-center gap-2 mt-2 mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={company.logoUrl} alt={company.name} className="h-8 w-auto max-w-[100px] object-contain" />
              <p className="text-[12px] text-[var(--color-muted)]">Current logo — upload a new one to replace it.</p>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
            className="w-full mt-1 text-[13px]"
          />
        </div>
        <div className="flex justify-between items-center pt-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" className="text-[13px] text-[#a32d2d] underline">
                {status === "deleting" ? "Deleting…" : "Delete company"}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {company.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This also deletes its clients and documents. This can&apos;t be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <PillButton type="submit">
            {status === "saving" ? "Saving…" : "Save"}
          </PillButton>
        </div>
      </form>
    </Card>
  );
}
