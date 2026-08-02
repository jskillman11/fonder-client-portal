import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/get-engagement";
import { EngagementSharedDriveForm } from "@/components/admin/engagement/EngagementSharedDriveForm";

export const dynamic = "force-dynamic";

export default async function EngagementSharedDrivePage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id, slug } = await params;
  const engagement = await getEngagement(slug);
  if (!engagement || engagement.companyId !== id) notFound();

  return (
    <EngagementSharedDriveForm
      engagementId={engagement.id}
      initialSharedDriveUrl={engagement.sharedDriveUrl ?? ""}
    />
  );
}
