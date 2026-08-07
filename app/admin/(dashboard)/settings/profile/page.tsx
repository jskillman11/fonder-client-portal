import { notFound } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/server";
import { EditProfileForm } from "@/components/admin/EditProfileForm";
import { BackButton } from "@/components/admin/BackButton";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const user = await getAdminUser();
  if (!user) notFound();

  return (
    <main className="py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <BackButton />
        <EditProfileForm
          email={user.email}
          fullName={user.fullName}
          jobTitle={user.jobTitle}
          avatarUrl={user.avatarUrl}
          iconBgColor={user.iconBgColor}
          iconTextColor={user.iconTextColor}
        />
      </div>
    </main>
  );
}
