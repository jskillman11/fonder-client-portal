import { notFound } from "next/navigation";
import Link from "next/link";
import { getCompany, listClientsForCompany } from "@/lib/companies-clients";
import { listDocuments } from "@/lib/documents";
import { listClientAccess } from "@/lib/client-access";
import { listEngagementsForCompany } from "@/lib/get-engagement";
import { Card } from "@/components/Card";
import { EditCompanyForm } from "@/components/admin/EditCompanyForm";
import { BackButton } from "@/components/admin/BackButton";
import { EngagementRow } from "@/components/admin/EngagementRow";
import { ClientRow } from "@/components/admin/ClientRow";
import { NewClientForm } from "@/components/admin/NewClientForm";
import { NewDocumentForm } from "@/components/admin/NewDocumentForm";

export const dynamic = "force-dynamic";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();

  const [engagements, clients, allDocuments, accessRecords] = await Promise.all([
    listEngagementsForCompany(id),
    listClientsForCompany(id),
    listDocuments(),
    listClientAccess(),
  ]);
  const documents = allDocuments.filter((d) => d.companyId === id);
  const accessByClientId = new Map(accessRecords.map((a) => [a.clientId, a]));

  return (
    <main className="py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <BackButton />

        <EditCompanyForm company={company} />

        <Card className="px-9 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold text-[var(--color-ink)]">Engagements</h2>
            <Link
              href={`/admin/companies/${id}/engagements/new`}
              className="text-[12px] underline text-[var(--color-muted)]"
            >
              + New engagement
            </Link>
          </div>
          {engagements.length === 0 ? (
            <p className="text-[13px] text-[var(--color-muted)]">
              No engagements yet for this company.
            </p>
          ) : (
            <div className="space-y-3">
              {engagements.map((e) => (
                <EngagementRow
                  key={e.id}
                  companyId={id}
                  clientSlug={e.clientSlug}
                  clientName={company.name}
                  engagementTitle={e.engagementTitle}
                />
              ))}
            </div>
          )}
        </Card>

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

        <Card className="px-9 py-8">
          <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-4">Documents</h2>
          <div className="mb-4">
            <NewDocumentForm companies={[company]} />
          </div>
          {documents.length === 0 ? (
            <p className="text-[13px] text-[var(--color-muted)]">No documents yet for this company.</p>
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
                    <p className="text-[12.5px] text-[var(--color-muted)]">{d.docType.toUpperCase()}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
