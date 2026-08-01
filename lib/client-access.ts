import { createServiceClient } from "./supabase/server";

export type ClientAccessRecord = {
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  hasAccess: boolean;
  lastSignInAt: string | null;
};

export async function listClientAccess(): Promise<ClientAccessRecord[]> {
  const supabase = createServiceClient();

  const { data: clientRows } = await supabase
    .from("clients")
    .select("id, first_name, last_name, email, companies(name)")
    .order("first_name", { ascending: true });

  if (!clientRows || clientRows.length === 0) return [];

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, client_id")
    .eq("role", "client");

  const profileIdByClientId = new Map(
    (profileRows ?? [])
      .filter((p) => p.client_id)
      .map((p) => [p.client_id as string, p.id]),
  );

  const { data: usersPage } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const usersById = new Map((usersPage?.users ?? []).map((u) => [u.id, u]));

  return clientRows.map((c) => {
    const company = Array.isArray(c.companies) ? c.companies[0] : c.companies;
    const profileId = profileIdByClientId.get(c.id);
    const user = profileId ? usersById.get(profileId) : undefined;

    return {
      clientId: c.id,
      firstName: c.first_name,
      lastName: c.last_name,
      email: c.email,
      companyName: company?.name ?? "Unknown company",
      hasAccess: Boolean(profileId),
      lastSignInAt: user?.last_sign_in_at ?? null,
    };
  });
}

export async function revokeClientAccess(
  clientId: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("client_id", clientId)
    .eq("role", "client")
    .maybeSingle();

  if (!profile) return { error: "This client doesn't have portal access yet." };

  const { error } = await supabase.auth.admin.deleteUser(profile.id);
  if (error) return { error: error.message };
  return { success: true };
}
