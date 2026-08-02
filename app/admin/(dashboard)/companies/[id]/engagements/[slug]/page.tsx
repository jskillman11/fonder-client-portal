import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/get-engagement";
import { EngagementOverviewForm } from "@/components/admin/engagement/EngagementOverviewForm";

export const dynamic = "force-dynamic";

export default async function EngagementOverviewPage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id, slug } = await params;
  const engagement = await getEngagement(slug);
  if (!engagement || engagement.companyId !== id) notFound();

  return (
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
      }}
    />
  );
}
