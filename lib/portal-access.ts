import { randomBytes } from "crypto";
import { Resend } from "resend";
import { createServiceClient } from "./supabase/server";

const LINK_EXPIRY_MINUTES = 30;
export const SESSION_COOKIE_MAX_AGE_DAYS = 30;

function cookieName(clientSlug: string) {
  return `portal_access_${clientSlug}`;
}

export function getPortalCookieName(clientSlug: string) {
  return cookieName(clientSlug);
}

// Creates a token and emails a magic link to the given address, but only if
// it matches the engagement's registered client signatory email -- prevents
// someone from redirecting the link to an email that isn't actually theirs.
export async function createAndSendMagicLink(
  clientSlug: string,
  requestedEmail: string,
  appOrigin: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = createServiceClient();

  const { data: engagement } = await supabase
    .from("engagements")
    .select("id, engagement_title, clients(email, first_name), companies(name)")
    .eq("client_slug", clientSlug)
    .single();

  if (!engagement) return { error: "Unknown client" };

  const client = Array.isArray(engagement.clients) ? engagement.clients[0] : engagement.clients;
  const company = Array.isArray(engagement.companies) ? engagement.companies[0] : engagement.companies;
  const registeredEmail = client?.email?.toLowerCase().trim();

  if (!registeredEmail || registeredEmail !== requestedEmail.toLowerCase().trim()) {
    return { error: "That email doesn't match our records for this portal." };
  }

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + LINK_EXPIRY_MINUTES * 60 * 1000);

  const { error: insertError } = await supabase.from("portal_access_tokens").insert({
    engagement_id: engagement.id,
    email: registeredEmail,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (insertError) return { error: insertError.message };

  const link = `${appOrigin}/portal/${clientSlug}/verify/${token}`;

  if (!process.env.RESEND_API_KEY) {
    return { error: "Email sending is not configured (missing RESEND_API_KEY)" };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error: emailError } = await resend.emails.send({
    from: process.env.PORTAL_EMAIL_FROM || "Fonder Studio <hello@fonder.studio>",
    to: registeredEmail,
    subject: `Access your portal — ${engagement.engagement_title}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
        <p>Hi ${client?.first_name ?? "there"},</p>
        <p>Here's your link to access ${company?.name ?? "your"} portal for <strong>${engagement.engagement_title}</strong>:</p>
        <p><a href="${link}" style="display:inline-block; background:#181a1e; color:#fff; padding:12px 20px; border-radius:999px; text-decoration:none; font-weight:600;">Open my portal</a></p>
        <p style="color:#6c6f76; font-size:13px;">This link expires in ${LINK_EXPIRY_MINUTES} minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (emailError) return { error: emailError.message };
  return { success: true };
}

// Validates a freshly-clicked magic link token (must be unexpired). Marks
// used_at for auditing (not enforced as single-use, so re-clicking the same
// emailed link -- e.g. from a second device -- still works within the window).
export async function verifyMagicLinkToken(
  token: string,
): Promise<{ clientSlug: string } | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("portal_access_tokens")
    .select("id, expires_at, used_at, engagements(client_slug)")
    .eq("token", token)
    .single();

  if (!data) return null;
  if (new Date(data.expires_at) < new Date()) return null;

  if (!data.used_at) {
    await supabase
      .from("portal_access_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", data.id);
  }

  const engagement = Array.isArray(data.engagements) ? data.engagements[0] : data.engagements;
  if (!engagement) return null;
  return { clientSlug: engagement.client_slug };
}

// Checks whether a session cookie value corresponds to a real, previously-
// verified token for this engagement -- no expiry check here, since the
// cookie's own 30-day max-age is what bounds the session length.
export async function hasValidSession(
  clientSlug: string,
  cookieValue: string | undefined,
): Promise<boolean> {
  if (!cookieValue) return false;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("portal_access_tokens")
    .select("id, used_at, engagements(client_slug)")
    .eq("token", cookieValue)
    .single();

  if (!data || !data.used_at) return false;
  const engagement = Array.isArray(data.engagements) ? data.engagements[0] : data.engagements;
  return engagement?.client_slug === clientSlug;
}
