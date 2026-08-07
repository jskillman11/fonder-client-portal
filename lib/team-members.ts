import { createServiceClient } from "./supabase/server";

export type TeamMemberRecord = {
  id: string;
  // Effective display values -- sourced from the linked staff profile when
  // staffId is set, otherwise this row's own name/role/icon columns.
  name: string;
  role: string;
  iconBgColor: string | null;
  iconTextColor: string | null;
  staffId: string | null;
  staffEmail: string | null;
};

type TeamMemberRow = {
  id: string;
  name: string;
  role: string;
  icon_bg_color: string | null;
  icon_text_color: string | null;
  staff_id: string | null;
  profiles: {
    full_name: string | null;
    job_title: string | null;
    icon_bg_color: string | null;
    icon_text_color: string | null;
  } | null;
};

const TEAM_MEMBER_SELECT =
  "id, name, role, icon_bg_color, icon_text_color, staff_id, profiles!staff_id(full_name, job_title, icon_bg_color, icon_text_color)";

// A linked roster entry mirrors its staff account -- name/role/icon colors
// are edited on the staff profile (Team > Staff accounts), not here, so
// this row's own columns are only a fallback for whatever the profile
// hasn't set yet (e.g. a brand-new staff account with no job_title).
function mapTeamMemberRow(row: TeamMemberRow, staffEmailById: Map<string, string>): TeamMemberRecord {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    name: profile?.full_name || row.name,
    role: profile?.job_title || row.role,
    iconBgColor: profile?.icon_bg_color ?? row.icon_bg_color,
    iconTextColor: profile?.icon_text_color ?? row.icon_text_color,
    staffId: row.staff_id,
    staffEmail: row.staff_id ? (staffEmailById.get(row.staff_id) ?? null) : null,
  };
}

// staff_id -> email, for showing which account a roster entry is linked to.
// Not selectable through the profiles table directly (email lives on
// auth.users), so this mirrors listStaff()'s admin.listUsers() lookup.
async function getStaffEmailsById(supabase: ReturnType<typeof createServiceClient>): Promise<Map<string, string>> {
  const { data: usersPage } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  return new Map((usersPage?.users ?? []).map((u) => [u.id, u.email ?? ""]));
}

export async function listTeamMembers(): Promise<TeamMemberRecord[]> {
  const supabase = createServiceClient();
  const [{ data }, staffEmailById] = await Promise.all([
    supabase.from("team_members").select(TEAM_MEMBER_SELECT).order("name", { ascending: true }),
    getStaffEmailsById(supabase),
  ]);

  return ((data ?? []) as unknown as TeamMemberRow[]).map((row) => mapTeamMemberRow(row, staffEmailById));
}

export async function getTeamMember(id: string): Promise<TeamMemberRecord | null> {
  const supabase = createServiceClient();
  const [{ data, error }, staffEmailById] = await Promise.all([
    supabase.from("team_members").select(TEAM_MEMBER_SELECT).eq("id", id).single(),
    getStaffEmailsById(supabase),
  ]);

  if (error || !data) return null;
  return mapTeamMemberRow(data as unknown as TeamMemberRow, staffEmailById);
}

export type UnlinkedStaffOption = {
  id: string;
  email: string;
  fullName: string | null;
  jobTitle: string | null;
};

// Staff accounts not yet linked to a roster entry -- the options offered
// when adding an existing staff member to a company's account team instead
// of typing their name/role in fresh. fullName/jobTitle let the picker seed
// sensible defaults (and show a friendly label) before the link is saved.
export async function listUnlinkedStaffForRoster(): Promise<UnlinkedStaffOption[]> {
  const supabase = createServiceClient();
  const [{ data: profileRows }, staffEmailById] = await Promise.all([
    supabase.from("profiles").select("id, full_name, job_title").eq("role", "staff"),
    getStaffEmailsById(supabase),
  ]);
  const { data: linkedRows } = await supabase.from("team_members").select("staff_id").not("staff_id", "is", null);
  const linkedIds = new Set((linkedRows ?? []).map((r) => r.staff_id));

  return (profileRows ?? [])
    .filter((p) => !linkedIds.has(p.id))
    .map((p) => ({
      id: p.id,
      email: staffEmailById.get(p.id) ?? "",
      fullName: p.full_name,
      jobTitle: p.job_title,
    }))
    .sort((a, b) => (a.fullName || a.email).localeCompare(b.fullName || b.email));
}

// staffId links this roster entry to a staff account -- when set, name/role
// are seeded from that account's current profile as a sensible fallback
// (see mapTeamMemberRow), but the live values always win once linked.
export async function createTeamMember(
  name: string,
  role: string,
  iconBgColor: string | null,
  iconTextColor: string | null,
  staffId: string | null,
): Promise<{ id: string } | { error: string }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("team_members")
    .insert({ name, role, icon_bg_color: iconBgColor, icon_text_color: iconTextColor, staff_id: staffId })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

export async function updateTeamMemberRecord(
  id: string,
  name: string,
  role: string,
  iconBgColor: string | null,
  iconTextColor: string | null,
): Promise<{ success: true } | { error: string }> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("team_members")
    .update({ name, role, icon_bg_color: iconBgColor, icon_text_color: iconTextColor })
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function linkTeamMemberToStaff(
  id: string,
  staffId: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("team_members").update({ staff_id: staffId }).eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function unlinkTeamMember(id: string): Promise<{ success: true } | { error: string }> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("team_members").update({ staff_id: null }).eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteTeamMember(
  id: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function getCompanyTeamMemberIds(companyId: string): Promise<string[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("company_team_assignments")
    .select("team_member_id")
    .eq("company_id", companyId)
    .order("sort_order", { ascending: true });

  return (data ?? []).map((row) => row.team_member_id);
}
