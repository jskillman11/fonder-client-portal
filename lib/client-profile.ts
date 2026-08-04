import { createServiceClient } from "./supabase/server";

export async function updateMyClientProfile(
  clientId: string,
  firstName: string,
  lastName: string,
  email: string,
  jobTitle: string,
  photoFile: File | null,
): Promise<{ success: true } | { error: string }> {
  const supabase = createServiceClient();
  const update: {
    first_name: string;
    last_name: string;
    email: string;
    job_title: string;
    avatar_storage_path?: string;
  } = { first_name: firstName, last_name: lastName, email, job_title: jobTitle };

  if (photoFile) {
    const ext = photoFile.name.split(".").pop() || "png";
    // Unique path per upload -- a fixed path keeps the same public URL,
    // which browsers/CDNs then cache and keep serving stale after a
    // re-upload (same bug found and fixed for company logos/staff avatars).
    const avatarStoragePath = `client-avatars/${clientId}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("engagement-logos")
      .upload(avatarStoragePath, photoFile, {
        contentType: photoFile.type || "image/png",
      });
    if (uploadError) return { error: uploadError.message };
    update.avatar_storage_path = avatarStoragePath;

    const { data: current } = await supabase
      .from("clients")
      .select("avatar_storage_path")
      .eq("id", clientId)
      .single();
    if (current?.avatar_storage_path) {
      await supabase.storage.from("engagement-logos").remove([current.avatar_storage_path]);
    }
  }

  const { error } = await supabase.from("clients").update(update).eq("id", clientId);
  if (error) return { error: error.message };
  return { success: true };
}
