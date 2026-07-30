import { createServiceClient } from "./supabase/server";

export type Company = {
  id: string;
  name: string;
  logoUrl: string | null;
};

export type Client = {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
};

export async function listCompanies(): Promise<Company[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("companies")
    .select("id, name, logo_storage_path")
    .order("name", { ascending: true });

  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    logoUrl: c.logo_storage_path
      ? supabase.storage.from("engagement-logos").getPublicUrl(c.logo_storage_path).data.publicUrl
      : null,
  }));
}

export async function listClients(): Promise<Client[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("clients")
    .select("id, company_id, first_name, last_name, email")
    .order("first_name", { ascending: true });

  return (data ?? []).map((c) => ({
    id: c.id,
    companyId: c.company_id,
    firstName: c.first_name,
    lastName: c.last_name,
    email: c.email,
  }));
}

export async function createCompany(
  name: string,
  logoFile: File | null,
): Promise<{ id: string } | { error: string }> {
  const supabase = createServiceClient();
  let logoStoragePath: string | null = null;

  if (logoFile) {
    const ext = logoFile.name.split(".").pop() || "png";
    logoStoragePath = `companies/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/logo.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("engagement-logos")
      .upload(logoStoragePath, logoFile, {
        contentType: logoFile.type || "image/png",
        upsert: true,
      });
    if (uploadError) return { error: uploadError.message };
  }

  const { data, error } = await supabase
    .from("companies")
    .insert({ name, logo_storage_path: logoStoragePath })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

export async function createClientRecord(
  companyId: string,
  firstName: string,
  lastName: string,
  email: string,
): Promise<{ id: string } | { error: string }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({ company_id: companyId, first_name: firstName, last_name: lastName, email })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}
