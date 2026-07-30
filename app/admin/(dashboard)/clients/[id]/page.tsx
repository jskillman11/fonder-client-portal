import { notFound } from "next/navigation";
import { getClient, getCompany } from "@/lib/companies-clients";
import { BackButton } from "@/components/admin/BackButton";
import { EditClientForm } from "@/components/admin/EditClientForm";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const company = await getCompany(client.companyId);

  return (
    <main className="py-12 px-4">
      <div className="max-w-lg mx-auto space-y-3">
        <BackButton />
        <EditClientForm client={client} companyName={company?.name ?? "Unknown company"} />
      </div>
    </main>
  );
}
