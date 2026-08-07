"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PillButton } from "@/components/PillButton";

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";

export function ClickUpConnectionForm({
  connected,
  connectedByEmail,
}: {
  connected: boolean;
  connectedByEmail: string | null;
}) {
  const router = useRouter();
  const [apiToken, setApiToken] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "disconnecting">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");

    const res = await fetch("/api/admin/update-clickup-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiToken }),
    });
    const data = await res.json();
    setStatus("idle");

    if (!res.ok) {
      toast.error(data.error || "Failed to connect ClickUp");
      return;
    }
    toast.success("Connected.");
    setApiToken("");
    router.refresh();
  }

  async function handleDisconnect() {
    setStatus("disconnecting");
    const res = await fetch("/api/admin/disconnect-clickup", { method: "POST" });
    setStatus("idle");

    if (!res.ok) {
      toast.error("Failed to disconnect ClickUp");
      return;
    }
    toast.success("Disconnected.");
    router.refresh();
  }

  if (connected) {
    return (
      <>
        <p className="text-[13px] text-[var(--color-muted-text)]">Connected</p>
        {connectedByEmail && (
          <p className="text-[13px] text-[var(--color-muted-text)] mb-4">
            Connected by {connectedByEmail}
          </p>
        )}
        <button
          type="button"
          onClick={handleDisconnect}
          disabled={status === "disconnecting"}
          className="text-[13px] font-medium text-[#a32d2d] underline"
        >
          {status === "disconnecting" ? "Disconnecting…" : "Disconnect"}
        </button>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="text-[13px] text-[var(--color-muted-text)] mb-3">
        Not connected. Paste a Personal API Token from Fonder&apos;s ClickUp account
        (Settings → Apps) to show client-visible tasks in the portal.
      </p>
      <input
        type="password"
        required
        value={apiToken}
        onChange={(e) => setApiToken(e.target.value)}
        placeholder="pk_..."
        className={inputClass}
      />
      <div className="flex justify-end mt-3">
        <PillButton type="submit">{status === "saving" ? "Connecting…" : "Connect"}</PillButton>
      </div>
    </form>
  );
}
