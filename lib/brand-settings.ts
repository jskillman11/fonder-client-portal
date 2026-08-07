import { createServiceClient } from "./supabase/server";
import { resizeStandaloneLogo } from "./logo-processing";
import { uploadToStorage } from "./storage-upload";

export type BrandLogoSlot = "login" | "sidebar";

// One asset rarely suits both: the login page shows a standalone wide-format
// logo, while the sidebar crops into a small square tile -- a wordmark-shaped
// logo that works fine on the login page reads as a plain block of color
// once squeezed into that tile. Hence two independently-managed slots.
const SLOT_COLUMN: Record<BrandLogoSlot, "login_logo_storage_path" | "sidebar_logo_storage_path"> = {
  login: "login_logo_storage_path",
  sidebar: "sidebar_logo_storage_path",
};

export async function getBrandLogoUrls(): Promise<{ login: string | null; sidebar: string | null }> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("brand_settings")
    .select("login_logo_storage_path, sidebar_logo_storage_path")
    .eq("id", true)
    .maybeSingle();

  const toUrl = (path: string | null | undefined) =>
    path ? supabase.storage.from("engagement-logos").getPublicUrl(path).data.publicUrl : null;

  return {
    login: toUrl(data?.login_logo_storage_path),
    sidebar: toUrl(data?.sidebar_logo_storage_path),
  };
}

export async function getLoginLogoUrl(): Promise<string | null> {
  return (await getBrandLogoUrls()).login;
}

export async function getSidebarLogoUrl(): Promise<string | null> {
  return (await getBrandLogoUrls()).sidebar;
}

export async function updateBrandLogo(
  slot: BrandLogoSlot,
  logoFile: File | null,
  removeLogo: boolean,
): Promise<{ success: true } | { error: string }> {
  const supabase = createServiceClient();
  const column = SLOT_COLUMN[slot];
  const otherColumn = SLOT_COLUMN[slot === "login" ? "sidebar" : "login"];

  const { data: current } = await supabase
    .from("brand_settings")
    .select(`${column}, ${otherColumn}`)
    .eq("id", true)
    .maybeSingle();
  const currentRow = current as Record<string, string | null> | null;
  const oldPath = currentRow?.[column] ?? null;
  // The two slots can (still, post-migration) point at the same physical
  // storage object -- don't delete it out from under the other slot just
  // because this one moved off it.
  const oldPathStillInUse = oldPath !== null && oldPath === currentRow?.[otherColumn];

  if (removeLogo) {
    const { error } = await supabase
      .from("brand_settings")
      .upsert({ id: true, [column]: null, updated_at: new Date().toISOString() });
    if (error) return { error: error.message };
    if (oldPath && !oldPathStillInUse) await supabase.storage.from("engagement-logos").remove([oldPath]);
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
  const path = `brand/${slot}-logo-${crypto.randomUUID().slice(0, 8)}.${extension}`;

  const uploadResult = await uploadToStorage("engagement-logos", path, uploadBuffer, contentType);
  if ("error" in uploadResult) return uploadResult;

  const { error } = await supabase
    .from("brand_settings")
    .upsert({ id: true, [column]: path, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };

  if (oldPath && !oldPathStillInUse) await supabase.storage.from("engagement-logos").remove([oldPath]);

  return { success: true };
}
