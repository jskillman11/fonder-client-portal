import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/get-engagement";
import { getAssignedTeamMemberIds } from "@/lib/team-members";
import { EngagementForm } from "@/components/admin/EngagementForm";
import { BackButton } from "@/components/admin/BackButton";

export const dynamic = "force-dynamic";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const engagement = await getEngagement(slug);

  if (!engagement) {
    notFound();
  }

  const teamMemberIds = await getAssignedTeamMemberIds(engagement.id);

  return (
    <main className="py-12 px-4">
      <div className="max-w-2xl mx-auto mb-3">
        <BackButton />
      </div>
      <EngagementForm
        mode="edit"
        initialCompanyName={engagement.clientName}
        initialValues={{
          clientSlug: engagement.clientSlug,
          companyId: engagement.companyId ?? "",
          clientId: engagement.clientId ?? "",
          sowDocumentId: engagement.sowDocumentId ?? "",
          msaDocumentId: engagement.msaDocumentId ?? "",
          engagementTitle: engagement.engagementTitle,
          totalFee: engagement.totalFee,
          finalDeliveryDate: engagement.finalDeliveryDate,
          kickoffEarliestDate: engagement.kickoffEarliestDate ?? "",
          teamMemberIds,
        }}
      />
    </main>
  );
}
