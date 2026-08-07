import { notFound } from "next/navigation";
import { getCompany } from "@/lib/companies-clients";
import { getCompanyEngagement } from "@/lib/get-engagement";
import { Card } from "@/components/Card";
import { EditCompanyForm } from "@/components/admin/EditCompanyForm";
import { CopyLinkButton } from "@/components/admin/CopyLinkButton";
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

  const portalUrl = company.clientSlug ? `/portal/${company.clientSlug}` : null;

  return (
    <div className="space-y-5">
      <EditCompanyForm company={company} />

      <Card className="px-9 py-6">
        <h2 className="text-[14px] font-bold text-[var(--color-ink)] mb-2">Portal link</h2>
        {portalUrl && (
          <div className="flex items-center gap-3">
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-semibold text-[var(--color-ink)] underline"
            >
              {portalUrl}
            </a>
            <CopyLinkButton text={portalUrl} />
          </div>
        )}
      </Card>

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
