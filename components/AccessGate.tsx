"use client";

import { useState } from "react";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";
import Image from "next/image";

export function AccessGate({ clientSlug }: { clientSlug: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorDetail(null);

    const res = await fetch("/api/portal/request-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientSlug, email }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorDetail(data.error || "Something went wrong.");
      return;
    }
    setStatus("sent");
  }

  return (
    <main className="min-h-screen bg-[var(--color-cream)] flex items-center justify-center px-4">
      <Card className="px-9 py-10 w-full max-w-sm text-center">
        <Image
          src="/fonder-logo.png"
          alt="Fonder"
          width={140}
          height={32}
          className="h-8 w-auto mx-auto mb-6"
        />
        {status === "sent" ? (
          <>
            <h1 className="text-[18px] font-bold text-[var(--color-ink)] mb-2">
              Check your email
            </h1>
            <p className="text-[14px] text-[var(--color-muted)]">
              We&apos;ve sent a link to {email} — open it to access your portal.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-[18px] font-bold text-[var(--color-ink)] mb-2">
              Access your portal
            </h1>
            <p className="text-[14px] text-[var(--color-muted)] mb-5">
              Enter your email and we&apos;ll send you a secure link.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px] text-center"
              />
              {status === "error" && (
                <p className="text-[13px] text-[#a32d2d]">{errorDetail}</p>
              )}
              <PillButton type="submit">
                {status === "sending" ? "Sending…" : "Send my link"}
              </PillButton>
            </form>
          </>
        )}
      </Card>
    </main>
  );
}
