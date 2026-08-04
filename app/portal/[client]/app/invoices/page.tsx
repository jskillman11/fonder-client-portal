import { notFound } from "next/navigation";
import { getCompanyEngagementHistory } from "@/lib/get-engagement";
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
  const [history, { isAdmin }] = await Promise.all([
    getCompanyEngagementHistory(client),
    hasPortalAccess(client),
  ]);
  if (!history) notFound();

  const canSimulatePayment = isAdmin && process.env.QUICKBOOKS_ENVIRONMENT !== "production";

  const engagementsWithInvoices = history.engagements.filter(
    (e) => e.qbInvoiceLink || e.invoicePaid,
  );

  if (engagementsWithInvoices.length === 0) {
    return (
      <PlaceholderTab
        title="Invoices"
        description="View and pay invoices for this engagement, once QuickBooks is connected."
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {engagementsWithInvoices.map((e) => {
        const isActiveAndUnpaid = e.status === "active" && !e.invoicePaid;

        return (
          <Card key={e.id} className="px-9 py-9 max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-[19px] font-bold text-[var(--color-ink)]">{e.totalFee}</h1>
              <span className="text-[12px] text-[var(--color-muted)] capitalize">{e.status}</span>
            </div>
            <p className="text-[13px] text-[var(--color-muted)] mb-4">
              {e.invoicePaid ? "Paid" : "Awaiting payment"}
            </p>
            {isActiveAndUnpaid ? (
              <PayInvoiceAction
                invoiceLink={e.qbInvoiceLink}
                invoicePaid={e.invoicePaid}
                engagementId={e.id}
                canSimulate={canSimulatePayment}
              />
            ) : (
              e.qbInvoiceLink && (
                <a
                  href={e.qbInvoiceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-medium text-[var(--color-ink)] underline"
                >
                  View invoice
                </a>
              )
            )}
          </Card>
        );
      })}
    </div>
  );
}
