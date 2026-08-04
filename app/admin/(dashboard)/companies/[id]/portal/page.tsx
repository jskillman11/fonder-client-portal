import { notFound } from "next/navigation";
import { getCompany } from "@/lib/companies-clients";
import { getCompanySettings } from "@/lib/company-settings";
import { Card } from "@/components/Card";
import { CompanySharedDriveForm } from "@/components/admin/company/CompanySharedDriveForm";
import { CompanyPortalContentForm } from "@/components/admin/company/CompanyPortalContentForm";

export const dynamic = "force-dynamic";

export default async function CompanyPortalSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();

  const settings = await getCompanySettings(id);

  return (
    <>
      <Card className="px-9 py-8">
        <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-4">Shared Drive</h2>
        <CompanySharedDriveForm companyId={id} initialSharedDriveUrl={settings?.sharedDriveUrl ?? ""} />
      </Card>

      <Card className="px-9 py-8">
        <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-4">Portal content &amp; locks</h2>
        <CompanyPortalContentForm
          companyId={id}
          initialLockPortalTabs={settings?.lockPortalTabs ?? true}
          initialTabLockOverrides={settings?.tabLockOverrides ?? {}}
        />
      </Card>
    </>
  );
}
