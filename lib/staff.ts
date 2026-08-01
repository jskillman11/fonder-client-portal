import { createServiceClient } from "./supabase/server";
import { sendBrandedActionEmail } from "./email-template";

export type StaffRecord = {
  id: string;
  email: string;
  isSuperAdmin: boolean;
  invitedAt: string;
  hasAccepted: boolean;
};

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
// them a branded invite link -- mirrors lib/portal-access.ts's magic-link
// pattern (generateLink creates the user and returns a hashed_token; no
// email is sent by Supabase itself, so we send our own).
export async function inviteStaff(
  email: string,
  makeSuperAdmin: boolean,
  appOrigin: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = createServiceClient();
  const normalizedEmail = email.toLowerCase().trim();

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "invite",
    email: normalizedEmail,
  });

  if (linkError || !linkData) {
    return { error: linkError?.message || "Failed to create staff invite" };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: linkData.user.id,
    role: "staff",
    is_super_admin: makeSuperAdmin,
  });

  if (profileError) return { error: profileError.message };

  const link = `${appOrigin}/admin/invite/${linkData.properties.hashed_token}`;

  return sendBrandedActionEmail({
    to: normalizedEmail,
    subject: "You've been invited to the Fonder admin dashboard",
    heading: "You're invited",
    body: "You've been added as a staff member on the Fonder Studio admin dashboard.",
    ctaLabel: "Accept invite",
    ctaUrl: link,
    footerNote:
      "This link can only be used by you. If you weren't expecting this, you can ignore this email.",
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
