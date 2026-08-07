import { notFound } from "next/navigation";
import Link from "next/link";
import { getCompany } from "@/lib/companies-clients";
import { getCompanyEngagement } from "@/lib/get-engagement";
import { listInstallments, listBillingCycles } from "@/lib/company-billing";
import { getConnectionStatus } from "@/lib/quickbooks";
import { Card } from "@/components/Card";
import { EngagementInstallmentsTable } from "@/components/admin/EngagementInstallmentsTable";
import { EngagementBillingCyclesTable } from "@/components/admin/EngagementBillingCyclesTable";
import { CreateInvoiceForm } from "@/components/admin/CreateInvoiceForm";

export const dynamic = "force-dynamic";

export default async function CompanyBillingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();

  const engagement = await getCompanyEngagement(id);
  if (!engagement) notFound();

  const [installments, cycles, qb] = await Promise.all([
    engagement.engagementType === "project" ? listInstallments(id) : Promise.resolve([]),
    engagement.engagementType === "partnership" ? listBillingCycles(id) : Promise.resolve([]),
    getConnectionStatus(),
  ]);

  return (
    <>
      <Card className="px-9 py-8">
        <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-4">
          Payment schedule — {engagement.engagementTitle || company.name}
        </h2>
        {engagement.engagementType === "project" ? (
          <EngagementInstallmentsTable installments={installments} />
        ) : (
          <EngagementBillingCyclesTable cycles={cycles} />
        )}
      </Card>

      <Card className="px-9 py-9">
        <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-4">Invoice</h2>
        {!engagement.totalFeeAmount ? (
          <p className="text-[13px] text-[var(--color-muted-text)]">
            Set a numeric total fee on the Overview tab and save, then come back here to create the invoice.
          </p>
        ) : engagement.qbInvoiceId ? (
          <>
            <p className="text-[14px] font-semibold text-[var(--color-ink)] mb-1">
              {engagement.invoicePaidAt ? "Paid" : "Awaiting payment"}
            </p>
            {engagement.invoiceSentAt && (
              <p className="text-[13px] text-[var(--color-muted-text)]">
                Sent {new Date(engagement.invoiceSentAt).toLocaleDateString()}
              </p>
            )}
            {engagement.invoicePaidAt && (
              <p className="text-[13px] text-[var(--color-muted-text)]">
                Paid {new Date(engagement.invoicePaidAt).toLocaleDateString()}
              </p>
            )}
            {engagement.qbInvoiceLink && (
              <a
                href={engagement.qbInvoiceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-medium text-[var(--color-ink)] underline mt-2 inline-block"
              >
                View hosted invoice
              </a>
            )}
          </>
        ) : (
          <CreateInvoiceForm companyId={id} />
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
