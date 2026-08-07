// @supabase/storage-js's own upload() method silently corrupts binary
// buffers when run inside Vercel's Node.js serverless runtime (confirmed
// by comparing it against a raw fetch() upload of the identical buffer,
// which came back byte-perfect where the SDK's did not -- never
// reproducible locally, so this is specific to that runtime, not our
// processing code). This bypasses the SDK for the actual upload call,
// going straight to the Storage REST API instead.
export async function uploadToStorage(
  bucket: string,
  path: string,
  body: Buffer,
  contentType: string,
  options: { upsert?: boolean } = {},
): Promise<{ success: true } | { error: string }> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      "Content-Type": contentType,
      ...(options.upsert ? { "x-upsert": "true" } : {}),
    },
    body: new Uint8Array(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { error: `Storage upload failed (${res.status}): ${detail}` };
  }
  return { success: true };
}
