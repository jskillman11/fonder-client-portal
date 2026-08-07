import { notFound } from "next/navigation";
import { getCompany } from "@/lib/companies-clients";
import { getCompanyTeamMemberIds } from "@/lib/team-members";
import { getCompanySettings } from "@/lib/company-settings";
import { Card } from "@/components/Card";
import { CompanyTeamForm } from "@/components/admin/company/CompanyTeamForm";
import { CompanyPortalSettingsForm } from "@/components/admin/company/CompanyPortalSettingsForm";

export const dynamic = "force-dynamic";

export default async function CompanySettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();

  const [teamMemberIds, settings] = await Promise.all([
    getCompanyTeamMemberIds(id),
    getCompanySettings(id),
  ]);

  return (
    <div className="space-y-5">
      <Card className="px-9 py-8">
        <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-4">Assigned team</h2>
        <CompanyTeamForm companyId={id} initialTeamMemberIds={teamMemberIds} />
      </Card>

      <CompanyPortalSettingsForm
        companyId={id}
        initialSharedDriveUrl={settings?.sharedDriveUrl ?? ""}
        initialLockPortalTabs={settings?.lockPortalTabs ?? true}
        initialTabLockOverrides={settings?.tabLockOverrides ?? {}}
      />
    </div>
  );
}
