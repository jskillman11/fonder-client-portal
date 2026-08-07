import { notFound } from "next/navigation";
import { getCompany } from "@/lib/companies-clients";
import { getCompanyEngagement } from "@/lib/get-engagement";
import { EditCompanyForm } from "@/components/admin/EditCompanyForm";
import { EngagementOverviewForm } from "@/components/admin/EngagementOverviewForm";

export const dynamic = "force-dynamic";

export default async function CompanyOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();

  const engagement = await getCompanyEngagement(id);
  if (!engagement) notFound();

  return (
    <div className="space-y-5">
      <EditCompanyForm company={company} />

      <EngagementOverviewForm
        companyId={id}
        initialValues={{
          clientId: engagement.clientId ?? "",
          engagementTitle: engagement.engagementTitle,
          engagementType: engagement.engagementType,
          partnershipTier: engagement.partnershipTier ?? "",
          paymentTerms: engagement.paymentTerms === "monthly_in_advance" ? "" : (engagement.paymentTerms ?? ""),
          durationMonths: engagement.durationMonths?.toString() ?? "",
          totalFee: engagement.totalFee,
          totalFeeAmount: engagement.totalFeeAmount?.toString() ?? "",
          finalDeliveryDate: engagement.finalDeliveryDate,
          kickoffEarliestDate: engagement.kickoffEarliestDate ?? "",
          scopeSummary: engagement.scopeSummary ?? "",
          milestones: engagement.milestones,
        }}
      />
    </div>
  );
}
