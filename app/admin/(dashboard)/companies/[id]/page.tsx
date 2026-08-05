import { notFound } from "next/navigation";
import Link from "next/link";
import { getCompany } from "@/lib/companies-clients";
import { getActiveEngagementForCompany } from "@/lib/get-engagement";
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

  const engagement = await getActiveEngagementForCompany(id);
  const portalUrl = company.clientSlug ? `/portal/${company.clientSlug}` : null;

  return (
    <div className="space-y-5">
      <EditCompanyForm company={company} />

      <Card className="px-9 py-6">
        <h2 className="text-[14px] font-bold text-[var(--color-ink)] mb-2">Portal link</h2>
        {portalUrl ? (
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
        ) : (
          <p className="text-[13px] text-[var(--color-muted-text)]">
            No portal link yet — it&apos;s set the first time an engagement is created for this company, and stays
            the same across any future engagements.
          </p>
        )}
      </Card>

      {engagement ? (
        <EngagementOverviewForm
          engagementId={engagement.id}
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
            status: engagement.status,
          }}
        />
      ) : (
        <Card className="px-9 py-8 text-center">
          <p className="text-[13px] text-[var(--color-muted-text)] mb-3">No active engagement for this company.</p>
          <Link
            href={`/admin/companies/${id}/engagements/new`}
            className="text-[13px] font-semibold text-[var(--color-ink)] underline"
          >
            + Start an engagement
          </Link>
        </Card>
      )}
    </div>
  );
}
