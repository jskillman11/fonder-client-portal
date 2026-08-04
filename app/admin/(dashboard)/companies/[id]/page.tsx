import { notFound } from "next/navigation";
import { getCompany } from "@/lib/companies-clients";
import { EditCompanyForm } from "@/components/admin/EditCompanyForm";

export const dynamic = "force-dynamic";

export default async function CompanyOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();

  return <EditCompanyForm company={company} />;
}
