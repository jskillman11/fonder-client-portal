import { notFound } from "next/navigation";
import Link from "next/link";
import { getCompany } from "@/lib/companies-clients";
import { listEngagementsForCompany } from "@/lib/get-engagement";
import { Card } from "@/components/Card";
import { EngagementRow } from "@/components/admin/EngagementRow";

export const dynamic = "force-dynamic";

export default async function CompanyEngagementsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();

  const engagements = await listEngagementsForCompany(id);
  const hasActiveEngagement = engagements.some((e) => e.status === "active");

  return (
    <Card className="px-9 py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-bold text-[var(--color-ink)]">Engagements</h2>
        {hasActiveEngagement ? (
          <span className="text-[12px] text-[var(--color-faint)]">
            Mark the active engagement completed to start a new one
          </span>
        ) : (
          <Link
            href={`/admin/companies/${id}/engagements/new`}
            className="text-[12px] underline text-[var(--color-muted)]"
          >
            + New engagement
          </Link>
        )}
      </div>
      {engagements.length === 0 ? (
        <p className="text-[13px] text-[var(--color-muted)]">No engagements yet for this company.</p>
      ) : (
        <div className="space-y-3">
          {engagements.map((e) => (
            <EngagementRow
              key={e.id}
              companyId={id}
              companyClientSlug={company.clientSlug}
              engagementId={e.id}
              clientName={company.name}
              engagementTitle={e.engagementTitle}
              status={e.status}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
