import { createServiceClient } from "./supabase/server";
import { normalizeLogoImage } from "./logo-processing";
import { uploadToStorage } from "./storage-upload";

export type Company = {
  id: string;
  name: string;
  logoUrl: string | null;
  logoBackgroundColor: string;
  clientSlug: string | null;
  qbCustomerId: string | null;
  clickupListIds: string[];
  googleSheetIds: string[];
};

const COMPANY_COLUMNS =
  "id, name, logo_storage_path, logo_background_color, client_slug, qb_customer_id, clickup_list_ids, google_sheet_ids";

function mapCompanyRow(
  supabase: ReturnType<typeof createServiceClient>,
  data: {
    id: string;
    name: string;
    logo_storage_path: string | null;
    logo_background_color: string;
    client_slug: string | null;
    qb_customer_id: string | null;
    clickup_list_ids: string[] | null;
    google_sheet_ids: string[] | null;
  },
): Company {
  return {
    id: data.id,
    name: data.name,
    logoUrl: data.logo_storage_path
      ? supabase.storage.from("engagement-logos").getPublicUrl(data.logo_storage_path).data.publicUrl
      : null,
    logoBackgroundColor: data.logo_background_color,
    clientSlug: data.client_slug,
    qbCustomerId: data.qb_customer_id,
    clickupListIds: data.clickup_list_ids ?? [],
    googleSheetIds: data.google_sheet_ids ?? [],
  };
}

export type Client = {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string | null;
  avatarUrl: string | null;
};

export async function listCompanies(): Promise<Company[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("companies")
    .select(COMPANY_COLUMNS)
    .order("name", { ascending: true });

  return (data ?? []).map((c) => mapCompanyRow(supabase, c));
}

export async function listClients(): Promise<Client[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("clients")
    .select("id, company_id, first_name, last_name, email, job_title, avatar_storage_path")
    .order("first_name", { ascending: true });

  return (data ?? []).map((c) => ({
    id: c.id,
    companyId: c.company_id,
    firstName: c.first_name,
    lastName: c.last_name,
    email: c.email,
    jobTitle: c.job_title,
    avatarUrl: c.avatar_storage_path
      ? supabase.storage.from("engagement-logos").getPublicUrl(c.avatar_storage_path).data.publicUrl
      : null,
  }));
}

export async function getCompany(id: string): Promise<Company | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("companies")
    .select(COMPANY_COLUMNS)
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return mapCompanyRow(supabase, data);
}

export async function getCompanyBySlug(clientSlug: string): Promise<Company | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("companies")
    .select(COMPANY_COLUMNS)
    .eq("client_slug", clientSlug)
    .single();

  if (error || !data) return null;
  return mapCompanyRow(supabase, data);
}

// A manual file upload always wins if both are given. logoDomain fetches a
// favicon server-side (Google's icon service -- no key, no account, but it's
// a favicon, not a full logo, so quality varies by site) and re-hosts it in
// our own bucket exactly like a manual upload, rather than storing an
// external URL directly (keeps logo_storage_path meaning what it already
// means everywhere else: a path within our own 'engagement-logos' bucket).
//
// Distinguishes "nothing provided" (buffer: null, a legitimate no-op) from
// "a domain was given but we couldn't get a logo from it" (an error) --
// letting the latter silently fall through to a no-op previously meant a
// failed fetch still reported "Saved." with nothing actually changed.
async function resolveLogoSource(
  logoFile: File | null,
  logoDomain: string | null,
): Promise<{ buffer: Buffer | null } | { error: string }> {
  if (logoFile) {
    return { buffer: Buffer.from(await logoFile.arrayBuffer()) };
  }

  const domain = logoDomain?.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!domain) return { buffer: null };

  let res: Response;
  try {
    res = await fetch(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`);
  } catch (err) {
    return {
      error: `Couldn't reach the favicon service for "${domain}": ${err instanceof Error ? err.message : String(err)}`,
    };
  }
  if (!res.ok) {
    return {
      error: `Couldn't fetch a logo for "${domain}" (favicon service returned ${res.status}). Check the domain, or upload a file instead.`,
    };
  }
  const arrayBuffer = await res.arrayBuffer();
  if (arrayBuffer.byteLength === 0) {
    return { error: `The favicon service returned an empty image for "${domain}". Try uploading a file instead.` };
  }
  return { buffer: Buffer.from(arrayBuffer) };
}

// Every logo (manual upload or fetched favicon) is normalized to a fixed
// canvas/padding via lib/logo-processing.ts, so brands look consistent
// regardless of source. existingLogoPath lets a background-color-only
// change (no new file/domain) re-normalize the CURRENT stored image against
// the new color, rather than requiring a re-upload just to recolor.
async function uploadCompanyLogo(
  supabase: ReturnType<typeof createServiceClient>,
  companyName: string,
  logoFile: File | null,
  logoDomain: string | null,
  backgroundColor: string,
  existingLogoPath: string | null,
): Promise<{ path: string | null } | { error: string }> {
  const resolved = await resolveLogoSource(logoFile, logoDomain);
  if ("error" in resolved) return { error: resolved.error };

  let rawBuffer = resolved.buffer;
  if (!rawBuffer && existingLogoPath) {
    const { data } = await supabase.storage.from("engagement-logos").download(existingLogoPath);
    if (data) rawBuffer = Buffer.from(await data.arrayBuffer());
  }
  if (!rawBuffer) return { path: null };

  const normalized = await normalizeLogoImage(rawBuffer, backgroundColor);
  // A unique path per upload (rather than a fixed companies/{slug}/logo.png
  // upsert target) so the public URL actually changes when the logo does --
  // re-uploading to the SAME path kept the same URL, which browsers/CDNs
  // then kept serving from cache even after the underlying file changed.
  const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const path = `companies/${slug}/logo-${crypto.randomUUID().slice(0, 8)}.png`;
  const uploadResult = await uploadToStorage("engagement-logos", path, normalized, "image/png");
  if ("error" in uploadResult) return uploadResult;
  return { path };
}

export async function updateCompany(
  id: string,
  name: string,
  logoFile: File | null,
  logoDomain: string | null = null,
  logoBackgroundColor: string | null = null,
  removeLogo: boolean = false,
): Promise<{ success: true } | { error: string }> {
  const supabase = createServiceClient();

  const { data: current } = await supabase
    .from("companies")
    .select("logo_storage_path, logo_background_color")
    .eq("id", id)
    .single();

  const update: {
    name: string;
    logo_storage_path?: string | null;
    logo_background_color?: string;
  } = { name };

  if (removeLogo) {
    if (current?.logo_storage_path) {
      await supabase.storage.from("engagement-logos").remove([current.logo_storage_path]);
    }
    update.logo_storage_path = null;
  } else {
    const backgroundColor = logoBackgroundColor ?? current?.logo_background_color ?? "#ffffff";
    const backgroundColorChanged = logoBackgroundColor != null && logoBackgroundColor !== current?.logo_background_color;
    const existingPath = backgroundColorChanged ? (current?.logo_storage_path ?? null) : null;

    const logo = await uploadCompanyLogo(supabase, name, logoFile, logoDomain, backgroundColor, existingPath);
    if ("error" in logo) return { error: logo.error };
    if (logo.path) {
      update.logo_storage_path = logo.path;
      // Clean up the old object now that it's been replaced -- each upload
      // gets its own unique path, so the previous file would otherwise sit
      // around in storage forever, unreferenced.
      if (current?.logo_storage_path && current.logo_storage_path !== logo.path) {
        await supabase.storage.from("engagement-logos").remove([current.logo_storage_path]);
      }
    }
    if (logoBackgroundColor != null) update.logo_background_color = logoBackgroundColor;
  }

  const { error } = await supabase.from("companies").update(update).eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function listClientsForCompany(companyId: string): Promise<Client[]> {
  const all = await listClients();
  return all.filter((c) => c.companyId === companyId);
}

export async function getClient(id: string): Promise<Client | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, company_id, first_name, last_name, email, job_title, avatar_storage_path")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    companyId: data.company_id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    jobTitle: data.job_title,
    avatarUrl: data.avatar_storage_path
      ? supabase.storage.from("engagement-logos").getPublicUrl(data.avatar_storage_path).data.publicUrl
      : null,
  };
}

export async function updateClientRecord(
  id: string,
  firstName: string,
  lastName: string,
  email: string,
  jobTitle: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("clients")
    .update({ first_name: firstName, last_name: lastName, email, job_title: jobTitle })
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteClientRecord(
  id: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteCompany(
  id: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

// Slugifies the company name into a portal URL, appending -2/-3/... on
// collision. A company's portal now exists the moment it's created --
// there's no separate "start an engagement" step that used to be the only
// place a client_slug got assigned.
async function generateUniqueClientSlug(supabase: ReturnType<typeof createServiceClient>, name: string): Promise<string> {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "client";

  for (let suffix = 0; ; suffix++) {
    const candidate = suffix === 0 ? base : `${base}-${suffix + 1}`;
    const { data } = await supabase.from("companies").select("id").eq("client_slug", candidate).maybeSingle();
    if (!data) return candidate;
  }
}

export async function createCompany(
  name: string,
  logoFile: File | null,
  logoDomain: string | null = null,
  logoBackgroundColor: string = "#ffffff",
): Promise<{ id: string } | { error: string }> {
  const supabase = createServiceClient();

  const logo = await uploadCompanyLogo(supabase, name, logoFile, logoDomain, logoBackgroundColor, null);
  if ("error" in logo) return { error: logo.error };

  const clientSlug = await generateUniqueClientSlug(supabase, name);

  const { data, error } = await supabase
    .from("companies")
    .insert({
      name,
      logo_storage_path: logo.path,
      logo_background_color: logoBackgroundColor,
      client_slug: clientSlug,
    })
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
