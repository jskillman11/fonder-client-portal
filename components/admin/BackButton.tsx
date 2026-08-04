"use client";

import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-1 text-[13px] text-[var(--color-muted-text)] hover:text-[var(--color-ink)] mb-2"
    >
      ← Back
    </button>
  );
}
