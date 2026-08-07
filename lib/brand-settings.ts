import { createServiceClient } from "./supabase/server";
import { normalizeLogoImage } from "./logo-processing";

// Flatten background for the admin-dashboard brand mark -- this asset isn't
// shown against varied colored contexts the way company logos are, so
// there's no need for a per-upload color picker like EditCompanyForm's.
const BRAND_LOGO_BACKGROUND = "#ffffff";

export async function getBrandLogoUrl(): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("brand_settings")
    .select("logo_storage_path")
    .eq("id", true)
    .maybeSingle();

  if (!data?.logo_storage_path) return null;
  return supabase.storage.from("engagement-logos").getPublicUrl(data.logo_storage_path).data.publicUrl;
}

export async function updateBrandLogo(
  logoFile: File | null,
  removeLogo: boolean,
): Promise<{ success: true } | { error: string }> {
  const supabase = createServiceClient();

  const { data: current } = await supabase
    .from("brand_settings")
    .select("logo_storage_path")
    .eq("id", true)
    .maybeSingle();
  const oldPath = current?.logo_storage_path ?? null;

  if (removeLogo) {
    const { error } = await supabase
      .from("brand_settings")
      .upsert({ id: true, logo_storage_path: null, updated_at: new Date().toISOString() });
    if (error) return { error: error.message };
    if (oldPath) await supabase.storage.from("engagement-logos").remove([oldPath]);
    return { success: true };
  }

  if (!logoFile) return { error: "No file provided" };

  const buffer = Buffer.from(await logoFile.arrayBuffer());
  const normalized = await normalizeLogoImage(buffer, BRAND_LOGO_BACKGROUND);
  // A unique path per upload (rather than a fixed brand/fonder-logo.png
  // upsert target) so the public URL actually changes and isn't served
  // stale from cache -- same reasoning as companies' per-upload logo paths.
  const path = `brand/fonder-logo-${crypto.randomUUID().slice(0, 8)}.png`;

  const { error: uploadError } = await supabase.storage.from("engagement-logos").upload(path, normalized, {
    contentType: "image/png",
  });
  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase
    .from("brand_settings")
    .upsert({ id: true, logo_storage_path: path, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };

  if (oldPath) await supabase.storage.from("engagement-logos").remove([oldPath]);

  return { success: true };
}
