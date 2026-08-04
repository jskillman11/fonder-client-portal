import { notFound } from "next/navigation";
import { getCompany, listClientsForCompany } from "@/lib/companies-clients";
import { listClientAccess } from "@/lib/client-access";
import { Card } from "@/components/Card";
import { ClientRow } from "@/components/admin/ClientRow";
import { NewClientForm } from "@/components/admin/NewClientForm";

export const dynamic = "force-dynamic";

export default async function CompanyClientsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();

  const [clients, accessRecords] = await Promise.all([
    listClientsForCompany(id),
    listClientAccess(),
  ]);
  const accessByClientId = new Map(accessRecords.map((a) => [a.clientId, a]));

  return (
    <Card className="px-9 py-8">
      <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-4">Clients</h2>
      <div className="mb-4">
        <NewClientForm companies={[company]} />
      </div>
      {clients.length === 0 ? (
        <p className="text-[13px] text-[var(--color-muted)]">No clients yet for this company.</p>
      ) : (
        <div className="-mx-2">
          {clients.map((c) => (
            <ClientRow
              key={c.id}
              companyId={id}
              client={{
                id: c.id,
                firstName: c.firstName,
                lastName: c.lastName,
                email: c.email,
                companyName: company.name,
              }}
              access={accessByClientId.get(c.id)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
