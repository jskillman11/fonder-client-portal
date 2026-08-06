"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/Card";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.48-1.13 2.74-2.4 3.58v2.98h3.87c2.27-2.09 3.58-5.17 3.58-8.75z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.87-2.98c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.07C3.26 21.3 7.29 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.31c-.24-.72-.38-1.49-.38-2.31s.14-1.59.38-2.31V6.62H1.28A11.96 11.96 0 0 0 0 12c0 1.93.46 3.76 1.28 5.38l3.99-3.07z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.29 0 3.26 2.7 1.28 6.62l3.99 3.07C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [hasError] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("error"),
  );

  async function handleGoogleSignIn() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/admin/auth/callback`,
        queryParams: { hd: "fonder.studio" },
      },
    });
  }

  return (
    <main className="min-h-screen bg-[var(--color-cream)] flex items-center justify-center px-4">
      <Card className="px-9 py-10 w-full max-w-sm text-center">
        <h1 className="text-[20px] font-bold text-[var(--color-ink)] mb-2">Fonder Admin</h1>
        <p className="text-[13px] text-[var(--color-muted-text)] mb-6">
          Sign in with your Fonder Google Workspace account.
        </p>
        {hasError && (
          <p className="text-[13px] text-[#a32d2d] mb-4">
            Couldn&apos;t sign you in. Make sure you&apos;re using a Fonder staff account that&apos;s
            already been invited.
          </p>
        )}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2.5 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-white px-6 py-3 text-[13.5px] font-semibold text-[var(--color-ink)] hover:bg-[var(--color-cream)] disabled:opacity-50"
        >
          <GoogleIcon />
          {loading ? "Redirecting…" : "Continue with Google"}
        </button>
      </Card>
    </main>
  );
}
