"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[var(--color-cream)] flex items-center justify-center px-4">
      <Card className="px-9 py-10 w-full max-w-sm">
        <h1 className="text-[20px] font-bold text-[var(--color-ink)] mb-2 text-center">
          Set your password
        </h1>
        <p className="text-[13px] text-[var(--color-muted)] mb-6 text-center">
          Choose a password to finish setting up your Fonder admin account.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[13px] font-medium text-[var(--color-muted)]">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]"
            />
          </div>
          <div>
            <label className="text-[13px] font-medium text-[var(--color-muted)]">
              Confirm password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]"
            />
          </div>
          {error && (
            <p className="text-[13px] text-[#a32d2d] text-center">{error}</p>
          )}
          <div className="flex justify-center pt-2">
            <PillButton type="submit">
              {loading ? "Saving…" : "Save and continue"}
            </PillButton>
          </div>
        </form>
      </Card>
    </main>
  );
}
