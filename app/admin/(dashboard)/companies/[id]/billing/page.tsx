import { notFound } from "next/navigation";
import Link from "next/link";
import { getCompany } from "@/lib/companies-clients";
import { listEngagementsForCompany, getActiveEngagementForCompany } from "@/lib/get-engagement";
import { listInstallments, listBillingCycles } from "@/lib/engagement-billing";
import { getConnectionStatus } from "@/lib/quickbooks";
import { Card } from "@/components/Card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EngagementInstallmentsTable } from "@/components/admin/EngagementInstallmentsTable";
import { EngagementBillingCyclesTable } from "@/components/admin/EngagementBillingCyclesTable";

export const dynamic = "force-dynamic";

function invoiceStatus(e: { qbInvoiceId: string | null; invoicePaidAt: string | null }) {
  if (!e.qbInvoiceId) return { label: "None", variant: "outline" as const };
  if (e.invoicePaidAt) return { label: "Paid", variant: "default" as const };
  return { label: "Awaiting payment", variant: "secondary" as const };
}

export default async function CompanyBillingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();

  const [engagements, activeEngagement, qb] = await Promise.all([
    listEngagementsForCompany(id),
    getActiveEngagementForCompany(id),
    getConnectionStatus(),
  ]);

  const [installments, cycles] = activeEngagement
    ? await Promise.all([
        activeEngagement.engagementType === "project" ? listInstallments(activeEngagement.id) : Promise.resolve([]),
        activeEngagement.engagementType === "partnership"
          ? listBillingCycles(activeEngagement.id)
          : Promise.resolve([]),
      ])
    : [[], []];

  const history = engagements.filter((e) => e.id !== activeEngagement?.id);

  return (
    <>
      {activeEngagement && (
        <Card className="px-9 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold text-[var(--color-ink)]">
              Payment schedule — {activeEngagement.engagementTitle}
            </h2>
            <Link
              href={`/admin/companies/${id}/engagements/${activeEngagement.id}`}
              className="text-[12px] underline text-[var(--color-muted-text)]"
            >
              View engagement
            </Link>
          </div>
          {activeEngagement.engagementType === "project" ? (
            <EngagementInstallmentsTable installments={installments} />
          ) : (
            <EngagementBillingCyclesTable cycles={cycles} />
          )}
        </Card>
      )}

      <Card className="px-9 py-8">
        <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-4">History</h2>
        {history.length === 0 ? (
          <p className="text-[13px] text-[var(--color-muted-text)]">No past engagements for this company.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Engagement</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((e) => {
                const invoice = invoiceStatus(e);
                return (
                  <TableRow key={e.id}>
                    <TableCell>
                      <Link
                        href={`/admin/companies/${id}/engagements/${e.id}`}
                        className="font-semibold text-[var(--color-ink)] underline"
                      >
                        {e.engagementTitle}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{e.status}</Badge>
                    </TableCell>
                    <TableCell>{e.totalFee}</TableCell>
                    <TableCell>
                      {e.qbInvoiceLink ? (
                        <a href={e.qbInvoiceLink} target="_blank" rel="noreferrer">
                          <Badge variant={invoice.variant}>{invoice.label}</Badge>
                        </a>
                      ) : (
                        <Badge variant={invoice.variant}>{invoice.label}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="px-9 py-6">
        <p className="text-[13px] text-[var(--color-muted-text)]">
          QuickBooks:{" "}
          {qb.connected ? (
            <span className="font-semibold text-[var(--color-ink)]">
              Connected ({qb.environment}, by {qb.connectedByEmail})
            </span>
          ) : (
            <>
              <span className="font-semibold text-[var(--color-ink)]">Not connected.</span>{" "}
              <Link href="/admin/settings/connectors" className="underline text-[var(--color-ink)]">
                Connect in Settings
              </Link>
              .
            </>
          )}
        </p>
      </Card>
    </>
  );
}
