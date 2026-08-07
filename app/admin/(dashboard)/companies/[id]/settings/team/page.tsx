import { notFound } from "next/navigation";
import { getCompany } from "@/lib/companies-clients";
import { getCompanyTeamMemberIds } from "@/lib/team-members";
import { Card } from "@/components/Card";
import { CompanyTeamForm } from "@/components/admin/company/CompanyTeamForm";

export const dynamic = "force-dynamic";

export default async function CompanySettingsTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();

  const teamMemberIds = await getCompanyTeamMemberIds(id);

  return (
    <Card className="px-9 py-8">
      <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-4">Assigned team</h2>
      <CompanyTeamForm companyId={id} initialTeamMemberIds={teamMemberIds} />
    </Card>
  );
}
