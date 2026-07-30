import Link from "next/link";
import { listCompanies, listClients } from "@/lib/companies-clients";
import { Card } from "@/components/Card";
import { NewClientForm } from "@/components/admin/NewClientForm";
import { BackButton } from "@/components/admin/BackButton";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const [companies, clients] = await Promise.all([listCompanies(), listClients()]);
  const companyById = Object.fromEntries(companies.map((c) => [c.id, c.name]));

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
              <Link
                key={c.id}
                href={`/admin/clients/${c.id}`}
                className="block py-3 border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-cream)] -mx-7 px-7"
              >
                <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">
                  {c.firstName} {c.lastName}
                </p>
                <p className="text-[13px] text-[var(--color-muted)]">
                  {companyById[c.companyId] ?? "Unknown company"} · {c.email}
                </p>
              </Link>
            ))}
          </Card>
        )}
      </div>
    </main>
  );
}
