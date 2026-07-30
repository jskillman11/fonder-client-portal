import { notFound } from "next/navigation";
import { getDocument } from "@/lib/documents";
import { getCompany } from "@/lib/companies-clients";
import { BackButton } from "@/components/admin/BackButton";
import { EditDocumentForm } from "@/components/admin/EditDocumentForm";

export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const document = await getDocument(id);
  if (!document) notFound();

  const company = await getCompany(document.companyId);

  return (
    <main className="py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-3">
        <BackButton />
        <EditDocumentForm document={document} companyName={company?.name ?? "Unknown company"} />
      </div>
    </main>
  );
}
