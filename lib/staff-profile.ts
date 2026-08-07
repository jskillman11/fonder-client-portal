import { createServiceClient } from "./supabase/server";

export async function updateMyProfile(
  userId: string,
  fullName: string,
  jobTitle: string,
  photoFile: File | null,
  iconBgColor: string | null,
  iconTextColor: string | null,
): Promise<{ success: true } | { error: string }> {
  const supabase = createServiceClient();
  const update: {
    full_name: string;
    job_title: string;
    avatar_storage_path?: string;
    icon_bg_color: string | null;
    icon_text_color: string | null;
  } = {
    full_name: fullName,
    job_title: jobTitle,
    icon_bg_color: iconBgColor,
    icon_text_color: iconTextColor,
  };

  if (photoFile) {
    const ext = photoFile.name.split(".").pop() || "png";
    // Unique path per upload -- a fixed path keeps the same public URL,
    // which browsers/CDNs then cache and keep serving stale after a
    // re-upload (same bug found and fixed for company logos).
    const avatarStoragePath = `staff-avatars/${userId}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("engagement-logos")
      .upload(avatarStoragePath, photoFile, {
        contentType: photoFile.type || "image/png",
      });
    if (uploadError) return { error: uploadError.message };
    update.avatar_storage_path = avatarStoragePath;

    const { data: current } = await supabase
      .from("profiles")
      .select("avatar_storage_path")
      .eq("id", userId)
      .single();
    if (current?.avatar_storage_path) {
      await supabase.storage.from("engagement-logos").remove([current.avatar_storage_path]);
    }
  }

  const { error } = await supabase.from("profiles").update(update).eq("id", userId);
  if (error) return { error: error.message };
  return { success: true };
}
