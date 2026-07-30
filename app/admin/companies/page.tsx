import { listCompanies } from "@/lib/companies-clients";
import { Card } from "@/components/Card";
import { NewCompanyForm } from "@/components/admin/NewCompanyForm";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const companies = await listCompanies();

  return (
    <main className="min-h-screen bg-[var(--color-cream)] py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <h1 className="text-[20px] font-bold text-[var(--color-ink)]">
          Companies
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
              <div
                key={c.id}
                className="flex items-center gap-3 py-3 border-b border-[var(--color-border)] last:border-b-0"
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
              </div>
            ))}
          </Card>
        )}
      </div>
    </main>
  );
}
