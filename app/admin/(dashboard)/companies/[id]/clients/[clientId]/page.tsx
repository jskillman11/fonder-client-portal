import { notFound } from "next/navigation";
import { getClient, getCompany } from "@/lib/companies-clients";
import { EditClientForm } from "@/components/admin/EditClientForm";

export const dynamic = "force-dynamic";

export default async function CompanyClientDetailPage({
  params,
}: {
  params: Promise<{ id: string; clientId: string }>;
}) {
  const { id, clientId } = await params;
  const client = await getClient(clientId);
  if (!client || client.companyId !== id) notFound();

  const company = await getCompany(id);

  return (
    <main className="py-12 px-4">
      <div className="max-w-lg mx-auto space-y-3">
        <EditClientForm
          client={client}
          companyName={company?.name ?? "Unknown company"}
          backHref={`/admin/companies/${id}`}
        />
      </div>
    </main>
  );
}
