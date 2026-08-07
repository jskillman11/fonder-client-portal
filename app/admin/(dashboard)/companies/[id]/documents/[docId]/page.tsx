import { notFound } from "next/navigation";
import { getDocument } from "@/lib/documents";
import { getCompany } from "@/lib/companies-clients";
import { EditDocumentForm } from "@/components/admin/EditDocumentForm";

export const dynamic = "force-dynamic";

export default async function CompanyDocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>;
}) {
  const { id, docId } = await params;
  const document = await getDocument(docId);
  if (!document || document.companyId !== id) notFound();

  const company = await getCompany(id);

  return (
    <main className="py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-3">
        <EditDocumentForm
          document={document}
          companyName={company?.name ?? "Unknown company"}
          backHref={`/admin/companies/${id}/documents`}
        />
      </div>
    </main>
  );
}
