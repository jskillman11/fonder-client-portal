import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/get-engagement";
import { hasPortalAccess } from "@/lib/supabase/server";
import { Card } from "@/components/Card";
import { PlaceholderTab } from "@/components/portal-app/PlaceholderTab";
import { PayInvoiceAction } from "@/components/PayInvoiceAction";

export const dynamic = "force-dynamic";

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client } = await params;
  const [engagement, { isAdmin }] = await Promise.all([getEngagement(client), hasPortalAccess(client)]);
  if (!engagement) notFound();

  const canSimulatePayment = isAdmin && process.env.QUICKBOOKS_ENVIRONMENT !== "production";

  if (!engagement.qbInvoiceLink && !engagement.invoicePaid) {
    return (
      <PlaceholderTab
        title="Invoices"
        description="View and pay invoices here, once QuickBooks is connected."
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <Card className="px-9 py-9 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-[19px] font-bold text-[var(--color-ink)]">{engagement.totalFee}</h1>
        </div>
        <p className="text-[13px] text-[var(--color-muted-text)] mb-4">
          {engagement.invoicePaid ? "Paid" : "Awaiting payment"}
        </p>
        {!engagement.invoicePaid ? (
          <PayInvoiceAction
            invoiceLink={engagement.qbInvoiceLink}
            invoicePaid={engagement.invoicePaid}
            companyId={engagement.companyId ?? engagement.id}
            canSimulate={canSimulatePayment}
          />
        ) : (
          engagement.qbInvoiceLink && (
            <a
              href={engagement.qbInvoiceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-medium text-[var(--color-ink)] underline"
            >
              View invoice
            </a>
          )
        )}
      </Card>
    </div>
  );
}
