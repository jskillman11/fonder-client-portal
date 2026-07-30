import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/get-engagement";
import { EngagementForm } from "@/components/admin/EngagementForm";

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

  return (
    <main className="py-12 px-4">
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
          team: engagement.team.map((m) => ({
            name: m.name,
            role: m.role,
            blurb: m.blurb ?? "",
            iconBgColor: m.iconBgColor ?? "",
            iconTextColor: m.iconTextColor ?? "",
          })),
        }}
      />
    </main>
  );
}
