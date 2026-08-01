import { listCompanies, listClients } from "@/lib/companies-clients";
import { listClientAccess } from "@/lib/client-access";
import { Card } from "@/components/Card";
import { NewClientForm } from "@/components/admin/NewClientForm";
import { BackButton } from "@/components/admin/BackButton";
import { ClientRow } from "@/components/admin/ClientRow";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const [companies, clients, accessRecords] = await Promise.all([
    listCompanies(),
    listClients(),
    listClientAccess(),
  ]);
  const companyById = Object.fromEntries(companies.map((c) => [c.id, c.name]));
  const accessByClientId = new Map(accessRecords.map((a) => [a.clientId, a]));

  return (
    <main className="py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <BackButton />
        <h1 className="text-[20px] font-bold text-[var(--color-ink)]">
          Clients
        </h1>

        <NewClientForm companies={companies} />

        {clients.length === 0 ? (
          <Card className="px-9 py-9 text-center">
            <p className="text-[14px] text-[var(--color-muted)]">
              No clients yet — add the first one above.
            </p>
          </Card>
        ) : (
          <Card className="px-7 py-2">
            {clients.map((c) => (
              <ClientRow
                key={c.id}
                client={{
                  id: c.id,
                  firstName: c.firstName,
                  lastName: c.lastName,
                  email: c.email,
                  companyName: companyById[c.companyId] ?? "Unknown company",
                }}
                access={accessByClientId.get(c.id)}
              />
            ))}
          </Card>
        )}
      </div>
    </main>
  );
}
