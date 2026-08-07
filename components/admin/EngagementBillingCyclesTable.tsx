import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BillingCycleRow } from "@/lib/company-billing";

function statusBadge(status: BillingCycleRow["status"]) {
  if (status === "paid") return { label: "Paid", variant: "default" as const };
  if (status === "invoiced") return { label: "Awaiting payment", variant: "secondary" as const };
  return { label: "Pending", variant: "outline" as const };
}

// Read-only -- partnership cycles are created only by the monthly cron job
// (app/api/cron/partnership-invoices), never by a staff click.
export function EngagementBillingCyclesTable({ cycles }: { cycles: BillingCycleRow[] }) {
  if (cycles.length === 0) {
    return (
      <p className="text-[13px] text-[var(--color-muted-text)]">
        No billing cycles yet — the first one is created automatically on the 1st of next month.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Period</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cycles.map((cycle) => {
          const status = statusBadge(cycle.status);
          return (
            <TableRow key={cycle.id}>
              <TableCell className="font-semibold text-[var(--color-ink)]">{cycle.periodLabel}</TableCell>
              <TableCell>${cycle.amount.toLocaleString()}</TableCell>
              <TableCell>
                {cycle.qbInvoiceLink ? (
                  <a href={cycle.qbInvoiceLink} target="_blank" rel="noreferrer">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </a>
                ) : (
                  <Badge variant={status.variant}>{status.label}</Badge>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
