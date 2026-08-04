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
import type { DocumentRecord } from "@/lib/documents";

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted)]";

export function EditDocumentForm({
  document,
  companyName,
  backHref,
}: {
  document: DocumentRecord;
  companyName: string;
  backHref: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(document.title);
  const [content, setContent] = useState(document.contentMarkdown);
  const [status, setStatus] = useState<"idle" | "saving" | "deleting">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");

    const res = await fetch("/api/admin/update-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: document.id, title, contentMarkdown: content }),
    });
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

    const res = await fetch("/api/admin/delete-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: document.id }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("idle");
      toast.error([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }
    router.push(backHref);
  }

  return (
    <Card className="px-9 py-8">
      <p className="text-[13px] text-[var(--color-muted)] mb-1">
        {companyName} · {document.docType.toUpperCase()}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Content (Markdown)</label>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            className={`${inputClass} font-mono text-[12.5px]`}
          />
        </div>
        <div className="flex justify-between items-center pt-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" className="text-[13px] text-[#a32d2d] underline">
                {status === "deleting" ? "Deleting…" : "Delete document"}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete &quot;{document.title}&quot;?</AlertDialogTitle>
                <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
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
