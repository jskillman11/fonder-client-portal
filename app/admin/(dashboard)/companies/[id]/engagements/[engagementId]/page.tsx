import { notFound } from "next/navigation";
import { getEngagementById } from "@/lib/get-engagement";
import { BackButton } from "@/components/admin/BackButton";
import { EngagementOverviewForm } from "@/components/admin/EngagementOverviewForm";

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
          <p className="text-[13px] text-[var(--color-muted)]">{engagement.companyName}</p>
        </div>
        <EngagementOverviewForm
          engagementId={engagement.id}
          companyId={id}
          initialValues={{
            clientId: engagement.clientId ?? "",
            engagementTitle: engagement.engagementTitle,
            totalFee: engagement.totalFee,
            finalDeliveryDate: engagement.finalDeliveryDate,
            kickoffEarliestDate: engagement.kickoffEarliestDate ?? "",
            scopeSummary: engagement.scopeSummary ?? "",
            milestones: engagement.milestones,
            status: engagement.status,
          }}
        />
      </div>
    </main>
  );
}
