import Link from "next/link";
import { listDocuments } from "@/lib/documents";
import { listCompanies } from "@/lib/companies-clients";
import { Card } from "@/components/Card";
import { NewDocumentForm } from "@/components/admin/NewDocumentForm";
import { BackButton } from "@/components/admin/BackButton";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const [documents, companies] = await Promise.all([listDocuments(), listCompanies()]);
  const companyById = Object.fromEntries(companies.map((c) => [c.id, c.name]));

  return (
    <main className="py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <BackButton />
        <h1 className="text-[20px] font-bold text-[var(--color-ink)]">
          Documents
        </h1>
        <p className="text-[13px] text-[var(--color-muted)]">
          SOW and MSA content, scoped to a company — select these on the
          engagement setup screen instead of pasting content fresh each time.
        </p>

        <NewDocumentForm companies={companies} />

        {documents.length === 0 ? (
          <Card className="px-9 py-9 text-center">
            <p className="text-[14px] text-[var(--color-muted)]">
              No documents yet — add the first one above.
            </p>
          </Card>
        ) : (
          <Card className="px-7 py-2">
            {documents.map((d) => (
              <Link
                key={d.id}
                href={`/admin/documents/${d.id}`}
                className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-cream)] -mx-7 px-7"
              >
                <div>
                  <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">
                    {d.title}
                  </p>
                  <p className="text-[13px] text-[var(--color-muted)]">
                    {companyById[d.companyId] ?? "Unknown company"} ·{" "}
                    {d.docType.toUpperCase()}
                  </p>
                </div>
              </Link>
            ))}
          </Card>
        )}
      </div>
    </main>
  );
}
