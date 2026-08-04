import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/get-engagement";
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
  const engagement = await getEngagement(client);
  if (!engagement) notFound();

  if (!engagement.qbInvoiceLink && !engagement.invoicePaid) {
    return (
      <PlaceholderTab
        title="Invoices"
        description="View and pay invoices for this engagement, once QuickBooks is connected."
      />
    );
  }

  const status = engagement.invoicePaid ? "Paid" : "Awaiting payment";

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="px-9 py-9 max-w-lg mx-auto">
        <h1 className="text-[19px] font-bold text-[var(--color-ink)] mb-1">
          {engagement.totalFee}
        </h1>
        <p className="text-[13px] text-[var(--color-muted)] mb-4">{status}</p>
        <PayInvoiceAction invoiceLink={engagement.qbInvoiceLink} invoicePaid={engagement.invoicePaid} />
      </Card>
    </div>
  );
}
