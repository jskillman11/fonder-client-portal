import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/get-engagement";
import { EngagementPortalContentForm } from "@/components/admin/engagement/EngagementPortalContentForm";

export const dynamic = "force-dynamic";

export default async function EngagementPortalContentPage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id, slug } = await params;
  const engagement = await getEngagement(slug);
  if (!engagement || engagement.companyId !== id) notFound();

  return (
    <EngagementPortalContentForm
      engagementId={engagement.id}
      initialLockPortalTabs={engagement.lockPortalTabs}
      initialTabLockOverrides={engagement.tabLockOverrides}
    />
  );
}
