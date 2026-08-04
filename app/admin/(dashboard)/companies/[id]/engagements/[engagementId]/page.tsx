import { notFound } from "next/navigation";
import { getEngagementById } from "@/lib/get-engagement";
import { Card } from "@/components/Card";
import { BackButton } from "@/components/admin/BackButton";
import { EngagementOverviewForm } from "@/components/admin/EngagementOverviewForm";
import { CreateInvoiceForm } from "@/components/admin/CreateInvoiceForm";

export const dynamic = "force-dynamic";

export default async function EngagementDetailPage({
  params,
}: {
  params: Promise<{ id: string; engagementId: string }>;
}) {
  const { id, engagementId } = await params;
  const engagement = await getEngagementById(engagementId);
  if (!engagement || engagement.companyId !== id) notFound();

  return (
    <main className="py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <BackButton />
          <h1 className="text-[19px] font-bold text-[var(--color-ink)]">
            {engagement.engagementTitle}
          </h1>
          <p className="text-[13px] text-[var(--color-muted-text)]">{engagement.companyName}</p>
        </div>
        <EngagementOverviewForm
          engagementId={engagement.id}
          companyId={id}
          initialValues={{
            clientId: engagement.clientId ?? "",
            engagementTitle: engagement.engagementTitle,
            totalFee: engagement.totalFee,
            totalFeeAmount: engagement.totalFeeAmount?.toString() ?? "",
            finalDeliveryDate: engagement.finalDeliveryDate,
            kickoffEarliestDate: engagement.kickoffEarliestDate ?? "",
            scopeSummary: engagement.scopeSummary ?? "",
            milestones: engagement.milestones,
            status: engagement.status,
          }}
        />

        <Card className="px-9 py-9">
          <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-4">Invoice</h2>
          {!engagement.totalFeeAmount ? (
            <p className="text-[13px] text-[var(--color-muted-text)]">
              Set a numeric total fee above and save, then come back here to create the invoice.
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
            <CreateInvoiceForm engagementId={engagement.id} />
          )}
        </Card>
      </div>
    </main>
  );
}
