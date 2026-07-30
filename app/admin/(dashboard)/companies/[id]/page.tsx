import { notFound } from "next/navigation";
import Link from "next/link";
import { getCompany, listClientsForCompany } from "@/lib/companies-clients";
import { listDocuments } from "@/lib/documents";
import { Card } from "@/components/Card";
import { EditCompanyForm } from "@/components/admin/EditCompanyForm";
import { BackButton } from "@/components/admin/BackButton";

export const dynamic = "force-dynamic";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();

  const [clients, allDocuments] = await Promise.all([
    listClientsForCompany(id),
    listDocuments(),
  ]);
  const documents = allDocuments.filter((d) => d.companyId === id);

  return (
    <main className="py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <BackButton />

        <EditCompanyForm company={company} />

        <Card className="px-9 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold text-[var(--color-ink)]">Clients</h2>
            <Link href="/admin/clients" className="text-[12px] underline text-[var(--color-muted)]">
              + Add client
            </Link>
          </div>
          {clients.length === 0 ? (
            <p className="text-[13px] text-[var(--color-muted)]">No clients yet for this company.</p>
          ) : (
            <div className="space-y-3">
              {clients.map((c) => (
                <div key={c.id}>
                  <p className="text-[14px] font-semibold text-[var(--color-ink)]">
                    {c.firstName} {c.lastName}
                  </p>
                  <p className="text-[12.5px] text-[var(--color-muted)]">{c.email}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="px-9 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold text-[var(--color-ink)]">Documents</h2>
            <Link href="/admin/documents" className="text-[12px] underline text-[var(--color-muted)]">
              + Add document
            </Link>
          </div>
          {documents.length === 0 ? (
            <p className="text-[13px] text-[var(--color-muted)]">No documents yet for this company.</p>
          ) : (
            <div className="space-y-3">
              {documents.map((d) => (
                <div key={d.id}>
                  <p className="text-[14px] font-semibold text-[var(--color-ink)]">{d.title}</p>
                  <p className="text-[12.5px] text-[var(--color-muted)]">{d.docType.toUpperCase()}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
