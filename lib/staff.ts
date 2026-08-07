import { createServiceClient, type StaffUser } from "./supabase/server";
import { sendBrandedActionEmail } from "./email-template";

export type StaffRecord = {
  id: string;
  email: string;
  isSuperAdmin: boolean;
  invitedAt: string;
  hasAccepted: boolean;
};

// Like getAdminUser(), but for an arbitrary staff account rather than the
// current session -- used so a super-admin can view/edit someone else's
// profile (see app/admin/(dashboard)/settings/team/[id]/page.tsx).
export async function getStaffProfileById(id: string): Promise<StaffUser | null> {
  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, job_title, avatar_storage_path, icon_bg_color, icon_text_color")
    .eq("id", id)
    .eq("role", "staff")
    .single();

  if (!profile) return null;

  const { data: userData } = await supabase.auth.admin.getUserById(id);
  if (!userData?.user?.email) return null;

  return {
    id,
    email: userData.user.email,
    fullName: profile.full_name,
    jobTitle: profile.job_title,
    avatarUrl: profile.avatar_storage_path
      ? supabase.storage.from("engagement-logos").getPublicUrl(profile.avatar_storage_path).data.publicUrl
      : null,
    iconBgColor: profile.icon_bg_color,
    iconTextColor: profile.icon_text_color,
  };
}

export async function listStaff(): Promise<StaffRecord[]> {
  const supabase = createServiceClient();

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, is_super_admin, created_at")
    .eq("role", "staff");

  if (!profileRows || profileRows.length === 0) return [];

  const { data: usersPage } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const usersById = new Map((usersPage?.users ?? []).map((u) => [u.id, u]));

  return profileRows
    .map((p) => {
      const user = usersById.get(p.id);
      if (!user) return null;
      return {
        id: p.id,
        email: user.email ?? "",
        isSuperAdmin: p.is_super_admin,
        invitedAt: p.created_at,
        hasAccepted: Boolean(user.last_sign_in_at),
      };
    })
    .filter((s): s is StaffRecord => s !== null)
    .sort((a, b) => a.email.localeCompare(b.email));
}

// Creates a real Supabase Auth account for a new staff member and emails
// them a branded invite -- staff sign in with Google (see /admin/login), so
// unlike the old password flow there's no link to click to "accept": the
// account just needs to exist with a matching email before their first
// Google sign-in links to it.
export async function inviteStaff(
  email: string,
  makeSuperAdmin: boolean,
  appOrigin: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = createServiceClient();
  const normalizedEmail = email.toLowerCase().trim();

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return { error: createError?.message || "Failed to create staff account" };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: created.user.id,
    role: "staff",
    is_super_admin: makeSuperAdmin,
  });

  if (profileError) return { error: profileError.message };

  return sendBrandedActionEmail({
    to: normalizedEmail,
    subject: "You've been invited to the Fonder admin dashboard",
    heading: "You're invited",
    body: "You've been added as a staff member on the Fonder Studio admin dashboard. Sign in with your Fonder Google Workspace account to get started.",
    ctaLabel: "Sign in with Google",
    ctaUrl: `${appOrigin}/admin/login`,
    footerNote:
      "Use the Google account matching this email address. If you weren't expecting this, you can ignore this email.",
  });
}

async function countSuperAdmins(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<number> {
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "staff")
    .eq("is_super_admin", true);
  return count ?? 0;
}

export async function removeStaff(
  userId: string,
  requestingUserId: string,
): Promise<{ success: true } | { error: string }> {
  if (userId === requestingUserId) {
    return { error: "You can't remove your own account." };
  }

  const supabase = createServiceClient();

  const { data: target } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", userId)
    .eq("role", "staff")
    .single();

  if (!target) return { error: "Staff member not found." };

  if (target.is_super_admin && (await countSuperAdmins(supabase)) <= 1) {
    return { error: "Can't remove the last super-admin." };
  }

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateStaffSuperAdmin(
  userId: string,
  isSuperAdmin: boolean,
): Promise<{ success: true } | { error: string }> {
  const supabase = createServiceClient();

  const { data: target } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", userId)
    .eq("role", "staff")
    .single();

  if (!target) return { error: "Staff member not found." };

  if (!isSuperAdmin && target.is_super_admin && (await countSuperAdmins(supabase)) <= 1) {
    return { error: "Can't demote the last super-admin." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_super_admin: isSuperAdmin })
    .eq("id", userId)
    .eq("role", "staff");

  if (error) return { error: error.message };
  return { success: true };
}
