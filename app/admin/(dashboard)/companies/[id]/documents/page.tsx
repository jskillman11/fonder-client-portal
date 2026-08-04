import { notFound } from "next/navigation";
import Link from "next/link";
import { getCompany } from "@/lib/companies-clients";
import { getCompanySettings } from "@/lib/company-settings";
import { listDocuments } from "@/lib/documents";
import { Card } from "@/components/Card";
import { NewDocumentForm } from "@/components/admin/NewDocumentForm";
import { CompanyDocumentsInForceForm } from "@/components/admin/company/CompanyDocumentsInForceForm";

export const dynamic = "force-dynamic";

export default async function CompanyDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();

  const [allDocuments, settings] = await Promise.all([
    listDocuments(),
    getCompanySettings(id),
  ]);
  const documents = allDocuments.filter((d) => d.companyId === id);

  return (
    <Card className="px-9 py-8">
      <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-4">Documents</h2>
      <div className="mb-5 pb-5 border-b border-[var(--color-border)]">
        <CompanyDocumentsInForceForm
          companyId={id}
          documents={documents}
          initialSowDocumentId={settings?.sowDocumentId ?? ""}
          initialMsaDocumentId={settings?.msaDocumentId ?? ""}
        />
      </div>
      <div className="mb-4">
        <NewDocumentForm companies={[company]} />
      </div>
      {documents.length === 0 ? (
        <p className="text-[13px] text-[var(--color-muted-text)]">No documents yet for this company.</p>
      ) : (
        <div className="-mx-7 px-7">
          {documents.map((d) => (
            <Link
              key={d.id}
              href={`/admin/companies/${id}/documents/${d.id}`}
              className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-cream)] -mx-7 px-7"
            >
              <div>
                <p className="text-[14px] font-semibold text-[var(--color-ink)]">{d.title}</p>
                <p className="text-[12.5px] text-[var(--color-muted-text)]">{d.docType.toUpperCase()}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
