"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/admin/new-client");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[var(--color-cream)] flex items-center justify-center px-4">
      <Card className="px-9 py-10 w-full max-w-sm">
        <h1 className="text-[20px] font-bold text-[var(--color-ink)] mb-6 text-center">
          Fonder Admin
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[13px] font-medium text-[var(--color-muted)]">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]"
            />
          </div>
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
          {error && (
            <p className="text-[13px] text-[#a32d2d] text-center">{error}</p>
          )}
          <div className="flex justify-center pt-2">
            <PillButton type="submit">
              {loading ? "Signing in…" : "Sign in"}
            </PillButton>
          </div>
        </form>
      </Card>
    </main>
  );
}
