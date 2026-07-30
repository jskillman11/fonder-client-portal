import { createServiceClient } from "./supabase/server";

export type TeamMemberRecord = {
  id: string;
  name: string;
  role: string;
  iconBgColor: string | null;
  iconTextColor: string | null;
};

export async function listTeamMembers(): Promise<TeamMemberRecord[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("team_members")
    .select("id, name, role, icon_bg_color, icon_text_color")
    .order("name", { ascending: true });

  return (data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    role: t.role,
    iconBgColor: t.icon_bg_color,
    iconTextColor: t.icon_text_color,
  }));
}

export async function getTeamMember(id: string): Promise<TeamMemberRecord | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("id, name, role, icon_bg_color, icon_text_color")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    role: data.role,
    iconBgColor: data.icon_bg_color,
    iconTextColor: data.icon_text_color,
  };
}

export async function createTeamMember(
  name: string,
  role: string,
  iconBgColor: string | null,
  iconTextColor: string | null,
): Promise<{ id: string } | { error: string }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("team_members")
    .insert({ name, role, icon_bg_color: iconBgColor, icon_text_color: iconTextColor })
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

export async function deleteTeamMember(
  id: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function getAssignedTeamMemberIds(engagementId: string): Promise<string[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("engagement_team_assignments")
    .select("team_member_id")
    .eq("engagement_id", engagementId)
    .order("sort_order", { ascending: true });

  return (data ?? []).map((row) => row.team_member_id);
}
