import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/get-engagement";
import { getAssignedTeamMemberIds } from "@/lib/team-members";
import { EngagementTeamForm } from "@/components/admin/engagement/EngagementTeamForm";

export const dynamic = "force-dynamic";

export default async function EngagementTeamPage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id, slug } = await params;
  const engagement = await getEngagement(slug);
  if (!engagement || engagement.companyId !== id) notFound();

  const teamMemberIds = await getAssignedTeamMemberIds(engagement.id);

  return <EngagementTeamForm engagementId={engagement.id} initialTeamMemberIds={teamMemberIds} />;
}
