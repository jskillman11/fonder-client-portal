import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { resizeStandaloneLogo } from "@/lib/logo-processing";
import { createServiceClient } from "@/lib/supabase/server";

// TEMPORARY diagnostic route, unauthenticated on purpose so it can be
// curled directly against production without a session -- investigating
// why /api/admin/update-brand-logo uploads come back with identical
// (wrong) content regardless of the source file. Delete once resolved.
function describe(buffer: Buffer) {
  return {
    size: buffer.length,
    sha256: crypto.createHash("sha256").update(buffer).digest("hex"),
    first16Hex: buffer.subarray(0, 16).toString("hex"),
  };
}

export async function POST(req: NextRequest) {
  const receivedAt = Date.now();
  const formData = await req.formData();
  const file = formData.get("logo") as File | null;
  if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const resized = await resizeStandaloneLogo(buffer);

  const supabase = createServiceClient();
  const path = `debug/probe-${crypto.randomUUID().slice(0, 8)}.png`;
  const { error: uploadError } = await supabase.storage
    .from("engagement-logos")
    .upload(path, resized, { contentType: "image/png" });

  let downloadedViaPublicUrl: ReturnType<typeof describe> | null = null;
  let downloadedViaStorageApi: ReturnType<typeof describe> | null = null;
  let storageApiError: string | null = null;
  if (!uploadError) {
    const url = supabase.storage.from("engagement-logos").getPublicUrl(path).data.publicUrl;
    downloadedViaPublicUrl = describe(Buffer.from(await (await fetch(url)).arrayBuffer()));

    const { data: apiData, error: apiError } = await supabase.storage.from("engagement-logos").download(path);
    if (apiError) {
      storageApiError = apiError.message;
    } else {
      downloadedViaStorageApi = describe(Buffer.from(await apiData.arrayBuffer()));
    }
  }

  return NextResponse.json({
    receivedAt,
    fileName: file.name,
    fileType: file.type,
    fileSizeReported: file.size,
    raw: describe(buffer),
    resized: describe(resized),
    uploadError: uploadError?.message ?? null,
    downloadedViaPublicUrl,
    downloadedViaStorageApi,
    storageApiError,
    path,
  });
}
