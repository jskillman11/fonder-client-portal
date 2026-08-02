import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/get-engagement";
import { EngagementDocumentsForm } from "@/components/admin/engagement/EngagementDocumentsForm";

export const dynamic = "force-dynamic";

export default async function EngagementDocumentsPage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id, slug } = await params;
  const engagement = await getEngagement(slug);
  if (!engagement || engagement.companyId !== id) notFound();

  return (
    <EngagementDocumentsForm
      engagementId={engagement.id}
      companyId={id}
      initialSowDocumentId={engagement.sowDocumentId ?? ""}
      initialMsaDocumentId={engagement.msaDocumentId ?? ""}
    />
  );
}
