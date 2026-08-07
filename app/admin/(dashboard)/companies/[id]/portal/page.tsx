import { notFound } from "next/navigation";
import { getCompany } from "@/lib/companies-clients";
import { getCompanySettings } from "@/lib/company-settings";
import { CompanyPortalSettingsForm } from "@/components/admin/company/CompanyPortalSettingsForm";

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
    <CompanyPortalSettingsForm
      companyId={id}
      initialSharedDriveUrl={settings?.sharedDriveUrl ?? ""}
      initialLockPortalTabs={settings?.lockPortalTabs ?? true}
      initialTabLockOverrides={settings?.tabLockOverrides ?? {}}
    />
  );
}
