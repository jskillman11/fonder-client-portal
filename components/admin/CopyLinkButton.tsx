"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

export function CopyLinkButton({ text }: { text: string }) {
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    toast.success("Copied.");
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-ink)] underline"
    >
      <Copy className="size-3.5" />
      Copy
    </button>
  );
}
