import { Resend } from "resend";
import { createServiceClient } from "./supabase/server";

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
// matches the engagement's registered client signatory email -- prevents
// someone from redirecting the link to an email that isn't actually theirs.
// The link itself is a real Supabase Auth magic link (see verify/[token]),
// not a hand-rolled token -- Supabase enforces expiry and single-use on it.
export async function createAndSendMagicLink(
  clientSlug: string,
  requestedEmail: string,
  appOrigin: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = createServiceClient();

  const { data: engagement } = await supabase
    .from("engagements")
    .select("engagement_title, clients(id, email, first_name)")
    .eq("client_slug", clientSlug)
    .single();

  if (!engagement) return { error: "Unknown client" };

  const client = Array.isArray(engagement.clients) ? engagement.clients[0] : engagement.clients;
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

  if (!process.env.RESEND_API_KEY) {
    return { error: "Email sending is not configured (missing RESEND_API_KEY)" };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error: emailError } = await resend.emails.send({
    from: process.env.PORTAL_EMAIL_FROM || "Fonder Studio <hello@fonder.studio>",
    to: registeredEmail,
    subject: `Access your portal — ${engagement.engagement_title}`,
    html: `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2F1EC;padding:40px 16px;font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
      <tr>
        <td align="center">
          <table role="presentation" width="360" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #DED9CF;border-radius:22px;max-width:360px;">
            <tr>
              <td align="center" style="padding:40px 36px;">
                <img src="https://partners.fonder.studio/fonder-logo.png" width="52" height="52" alt="Fonder Studio" style="border-radius:12px;display:block;margin:0 auto;" />
                <h1 style="font-size:21px;font-weight:700;letter-spacing:-.02em;color:#181A1E;margin:20px 0 6px;">${engagement.engagement_title}</h1>
                <p style="font-size:13px;color:#6C6F76;line-height:1.5;margin:0 0 26px;">Your portal is ready to review and sign.</p>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" style="border-radius:999px;background:#181A1E;">
                      <a href="${link}" style="display:block;padding:13px 20px;font-size:13.5px;font-weight:600;color:#ffffff;text-decoration:none;">
                        Open my portal
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="font-size:12px;color:#6C6F76;line-height:1.6;margin:22px 0 0;">
                  This link can only be used by you. If you didn't request it, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
          <p style="font-size:11px;color:#8A8D93;margin-top:20px;">Fonder Studio &middot; sent to ${registeredEmail}</p>
        </td>
      </tr>
    </table>
    `,
  });

  if (emailError) return { error: emailError.message };
  return { success: true };
}
