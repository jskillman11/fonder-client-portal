"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { InstallmentRow } from "@/lib/company-billing";

function statusBadge(status: InstallmentRow["status"]) {
  if (status === "paid") return { label: "Paid", variant: "default" as const };
  if (status === "invoiced") return { label: "Awaiting payment", variant: "secondary" as const };
  return { label: "Pending", variant: "outline" as const };
}

export function EngagementInstallmentsTable({ installments }: { installments: InstallmentRow[] }) {
  const router = useRouter();
  const [creatingId, setCreatingId] = useState<string | null>(null);

  async function handleCreateInvoice(installmentId: string) {
    if (creatingId) return;
    setCreatingId(installmentId);
    const res = await fetch("/api/admin/create-installment-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ installmentId }),
    });
    const data = await res.json();
    setCreatingId(null);

    if (!res.ok) {
      toast.error([data.error, data.detail].filter(Boolean).join(" — "));
      return;
    }
    toast.success("Invoice created.");
    router.refresh();
  }

  if (installments.length === 0) {
    return (
      <p className="text-[13px] text-[var(--color-muted-text)]">
        No payment schedule yet — set payment terms and a numeric budget on this engagement.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Installment</TableHead>
          <TableHead>Percentage</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {installments.map((installment) => {
          const status = statusBadge(installment.status);
          return (
            <TableRow key={installment.id}>
              <TableCell className="font-semibold text-[var(--color-ink)]">{installment.triggerLabel}</TableCell>
              <TableCell>{installment.percentage}%</TableCell>
              <TableCell>${installment.amount.toLocaleString()}</TableCell>
              <TableCell>
                {installment.qbInvoiceLink ? (
                  <a href={installment.qbInvoiceLink} target="_blank" rel="noreferrer">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </a>
                ) : (
                  <Badge variant={status.variant}>{status.label}</Badge>
                )}
              </TableCell>
              <TableCell>
                {installment.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => handleCreateInvoice(installment.id)}
                    className="text-[12px] font-medium text-[var(--color-ink)] underline"
                  >
                    {creatingId === installment.id ? "Creating…" : "Create invoice"}
                  </button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
