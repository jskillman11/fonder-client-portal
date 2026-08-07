import { notFound } from "next/navigation";
import { getCompany } from "@/lib/companies-clients";
import { CompanyDataConnectorsForm } from "@/components/admin/company/CompanyDataConnectorsForm";

export const dynamic = "force-dynamic";

export default async function CompanyDataConnectorsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();

  return <CompanyDataConnectorsForm company={company} />;
}
