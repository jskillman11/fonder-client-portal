import Link from "next/link";
import { listCompanies } from "@/lib/companies-clients";
import { Card } from "@/components/Card";
import { NewCompanyForm } from "@/components/admin/NewCompanyForm";
import { BackButton } from "@/components/admin/BackButton";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const companies = await listCompanies();

  return (
    <main className="py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <BackButton />
        <h1 className="text-[20px] font-bold text-[var(--color-ink)]">
          All Clients
        </h1>

        <NewCompanyForm />

        {companies.length === 0 ? (
          <Card className="px-9 py-9 text-center">
            <p className="text-[14px] text-[var(--color-muted)]">
              No companies yet — add the first one above.
            </p>
          </Card>
        ) : (
          <Card className="px-7 py-2">
            {companies.map((c) => (
              <Link
                key={c.id}
                href={`/admin/companies/${c.id}`}
                className="flex items-center gap-3 py-3 border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-cream)] -mx-7 px-7"
              >
                {c.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.logoUrl} alt={c.name} className="h-6 w-auto max-w-[80px] object-contain" />
                ) : (
                  <div className="h-6 w-6 rounded bg-[var(--color-cream)] border border-[var(--color-border)]" />
                )}
                <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">
                  {c.name}
                </p>
              </Link>
            ))}
          </Card>
        )}
      </div>
    </main>
  );
}
