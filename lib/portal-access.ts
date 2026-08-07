import { createServiceClient } from "./supabase/server";
import { sendBrandedActionEmail } from "./email-template";

// Ensures a real Supabase Auth identity + client-role profile exists for the
// given client, keyed off our own `profiles.client_id` rather than a
// Supabase "get user by email" lookup (the admin API doesn't expose one).
// Idempotent across repeated "send access link" clicks.
async function ensureClientAuthUser(
  supabase: ReturnType<typeof createServiceClient>,
  clientId: string,
  email: string,
): Promise<{ error?: string }> {
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("client_id", clientId)
    .maybeSingle();

  if (existingProfile) return {};

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return { error: createError?.message || "Failed to create client account" };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: created.user.id,
    role: "client",
    client_id: clientId,
  });

  if (profileError) return { error: profileError.message };
  return {};
}

// Creates and emails a magic link to the given address, but only if it
// matches the company's registered client signatory email -- prevents
// someone from redirecting the link to an email that isn't actually theirs.
// The link itself is a real Supabase Auth magic link (see verify/[token]),
// not a hand-rolled token -- Supabase enforces expiry and single-use on it.
export async function createAndSendMagicLink(
  clientSlug: string,
  requestedEmail: string,
  appOrigin: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = createServiceClient();

  const { data: company } = await supabase
    .from("companies")
    .select("id, engagement_title, clients:client_id(id, email)")
    .eq("client_slug", clientSlug)
    .single();
  if (!company) return { error: "Unknown client" };

  const client = Array.isArray(company.clients) ? company.clients[0] : company.clients;
  const registeredEmail = client?.email?.toLowerCase().trim();

  if (!client || !registeredEmail || registeredEmail !== requestedEmail.toLowerCase().trim()) {
    return { error: "That email doesn't match our records for this portal." };
  }

  const ensureResult = await ensureClientAuthUser(supabase, client.id, registeredEmail);
  if (ensureResult.error) return { error: ensureResult.error };

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: registeredEmail,
  });

  if (linkError || !linkData) {
    return { error: linkError?.message || "Failed to generate access link" };
  }

  const link = `${appOrigin}/portal/${clientSlug}/verify/${linkData.properties.hashed_token}`;

  return sendBrandedActionEmail({
    to: registeredEmail,
    subject: `Access your portal — ${company.engagement_title}`,
    heading: company.engagement_title,
    body: "Your portal is ready to review and sign.",
    ctaLabel: "Open my portal",
    ctaUrl: link,
    footerNote: "This link can only be used by you. If you didn't request it, you can safely ignore this email.",
  });
}
