import { notFound, redirect } from "next/navigation";
import { getTeamMember } from "@/lib/team-members";
import { getStaffProfileById } from "@/lib/staff";
import { getAdminUser, isSuperAdminSession } from "@/lib/supabase/server";
import { EditProfileForm } from "@/components/admin/EditProfileForm";
import { LinkTeamMemberPrompt } from "@/components/admin/LinkTeamMemberPrompt";
import { UnlinkTeamMemberButton } from "@/components/admin/UnlinkTeamMemberButton";

export const dynamic = "force-dynamic";

export default async function TeamMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [teamMember, admin, isSuperAdmin] = await Promise.all([
    getTeamMember(id),
    getAdminUser(),
    isSuperAdminSession(),
  ]);
  if (!teamMember) notFound();

  const profile = teamMember.staffId ? await getStaffProfileById(teamMember.staffId) : null;

  if (!profile) {
    return (
      <main className="py-12 px-4">
        <div className="max-w-lg mx-auto space-y-3">
          <LinkTeamMemberPrompt teamMember={teamMember} />
        </div>
      </main>
    );
  }

  // A roster entry linked to your OWN staff account would otherwise
  // duplicate /admin/settings/profile exactly (same EditProfileForm, same
  // data) -- send you straight there instead of rendering a second copy of
  // the same page under a different URL. Someone else's linked entry has
  // no such duplicate (this is the only place to view/edit it), so it
  // keeps rendering here.
  if (admin?.id === profile.id) {
    redirect("/admin/settings/profile");
  }

  const canEdit = isSuperAdmin;

  return (
    <main className="py-12 px-4">
      <div className="max-w-lg mx-auto space-y-3">
        <EditProfileForm
          userId={profile.id}
          email={profile.email}
          fullName={profile.fullName}
          jobTitle={profile.jobTitle}
          avatarUrl={profile.avatarUrl}
          iconBgColor={profile.iconBgColor}
          iconTextColor={profile.iconTextColor}
          canEdit={canEdit}
        />
        {isSuperAdmin && (
          <div className="px-2">
            <UnlinkTeamMemberButton teamMemberId={teamMember.id} />
          </div>
        )}
      </div>
    </main>
  );
}
