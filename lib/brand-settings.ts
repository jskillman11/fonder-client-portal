import { createServiceClient } from "./supabase/server";
import { resizeStandaloneLogo } from "./logo-processing";

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

  // SVGs are vector -- store them as-is instead of rasterizing to PNG
  // (which locks them to a fixed resolution and looks blurry once scaled),
  // so they stay crisp at any size.
  const isSvg = logoFile.type === "image/svg+xml" || logoFile.name.toLowerCase().endsWith(".svg");
  const uploadBuffer = isSvg ? buffer : await resizeStandaloneLogo(buffer);
  const extension = isSvg ? "svg" : "png";
  const contentType = isSvg ? "image/svg+xml" : "image/png";

  // A unique path per upload (rather than a fixed brand/fonder-logo.png
  // upsert target) so the public URL actually changes and isn't served
  // stale from cache -- same reasoning as companies' per-upload logo paths.
  const path = `brand/fonder-logo-${crypto.randomUUID().slice(0, 8)}.${extension}`;

  const { error: uploadError } = await supabase.storage.from("engagement-logos").upload(path, uploadBuffer, {
    contentType,
  });
  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase
    .from("brand_settings")
    .upsert({ id: true, logo_storage_path: path, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };

  if (oldPath) await supabase.storage.from("engagement-logos").remove([oldPath]);

  return { success: true };
}
