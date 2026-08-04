import { NextResponse } from "next/server";
import { createServiceClient, requireAdmin } from "@/lib/supabase/server";
import { normalizeLogoImage } from "@/lib/logo-processing";

// One-off maintenance route: re-normalizes every existing company logo
// through the new fixed-canvas/padding/background pipeline, since logos
// uploaded before this pipeline existed are still in their original,
// inconsistent form. Remove this route once run successfully against every
// company that has a logo.
export async function POST() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const supabase = createServiceClient();
  const { data: companies, error } = await supabase
    .from("companies")
    .select("id, name, logo_storage_path, logo_background_color")
    .not("logo_storage_path", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = [];
  for (const c of companies ?? []) {
    if (!c.logo_storage_path) continue;

    const { data: file, error: downloadError } = await supabase.storage
      .from("engagement-logos")
      .download(c.logo_storage_path);
    if (downloadError || !file) {
      results.push({ name: c.name, status: "download-failed", error: downloadError?.message });
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const normalized = await normalizeLogoImage(buffer, c.logo_background_color || "#ffffff");
    // Unique path per run -- a fixed path would keep the same public URL,
    // which browsers/CDNs then cache and keep serving stale.
    const slug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const newPath = `companies/${slug}/logo-${crypto.randomUUID().slice(0, 8)}.png`;

    const { error: uploadError } = await supabase.storage
      .from("engagement-logos")
      .upload(newPath, normalized, { contentType: "image/png" });
    if (uploadError) {
      results.push({ name: c.name, status: "upload-failed", error: uploadError.message });
      continue;
    }

    await supabase.from("companies").update({ logo_storage_path: newPath }).eq("id", c.id);
    await supabase.storage.from("engagement-logos").remove([c.logo_storage_path]);
    results.push({ name: c.name, status: "ok" });
  }

  return NextResponse.json({ results });
}
