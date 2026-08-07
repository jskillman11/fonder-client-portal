import { notFound } from "next/navigation";
import { getTeamMember } from "@/lib/team-members";
import { getAdminUser } from "@/lib/supabase/server";
import { BackButton } from "@/components/admin/BackButton";
import { EditTeamMemberForm } from "@/components/admin/EditTeamMemberForm";

export const dynamic = "force-dynamic";

export default async function TeamMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [teamMember, admin] = await Promise.all([getTeamMember(id), getAdminUser()]);
  if (!teamMember) notFound();

  return (
    <main className="py-12 px-4">
      <div className="max-w-lg mx-auto space-y-3">
        <BackButton />
        <EditTeamMemberForm teamMember={teamMember} currentUserId={admin?.id ?? null} />
      </div>
    </main>
  );
}
