import { Resend } from "resend";

// Shared branded HTML shell for every "click this link" transactional email
// this app sends (client magic links, staff invites) -- one template so
// they stay visually consistent instead of drifting independently.
function brandedActionEmailHtml({
  heading,
  body,
  ctaLabel,
  ctaUrl,
  footerNote,
  sentTo,
}: {
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  footerNote: string;
  sentTo: string;
}): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2F1EC;padding:40px 16px;font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
      <tr>
        <td align="center">
          <table role="presentation" width="360" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #DED9CF;border-radius:22px;max-width:360px;">
            <tr>
              <td align="center" style="padding:40px 36px;">
                <img src="https://partners.fonder.studio/fonder-logo.png" width="52" height="52" alt="Fonder Studio" style="border-radius:12px;display:block;margin:0 auto;" />
                <h1 style="font-size:21px;font-weight:700;letter-spacing:-.02em;color:#181A1E;margin:20px 0 6px;">${heading}</h1>
                <p style="font-size:13px;color:#6C6F76;line-height:1.5;margin:0 0 26px;">${body}</p>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" style="border-radius:999px;background:#181A1E;">
                      <a href="${ctaUrl}" style="display:block;padding:13px 20px;font-size:13.5px;font-weight:600;color:#ffffff;text-decoration:none;">
                        ${ctaLabel}
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="font-size:12px;color:#6C6F76;line-height:1.6;margin:22px 0 0;">
                  ${footerNote}
                </p>
              </td>
            </tr>
          </table>
          <p style="font-size:11px;color:#8A8D93;margin-top:20px;">Fonder Studio &middot; sent to ${sentTo}</p>
        </td>
      </tr>
    </table>
    `;
}

// Sends a branded action-link email via Resend. Returns an error string on
// failure (missing config or Resend-reported error) instead of throwing, to
// match this app's existing `{ success } | { error }` result convention.
export async function sendBrandedActionEmail({
  to,
  subject,
  heading,
  body,
  ctaLabel,
  ctaUrl,
  footerNote,
}: {
  to: string;
  subject: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  footerNote: string;
}): Promise<{ success: true } | { error: string }> {
  if (!process.env.RESEND_API_KEY) {
    return { error: "Email sending is not configured (missing RESEND_API_KEY)" };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.PORTAL_EMAIL_FROM || "Fonder Studio <hello@fonder.studio>",
    to,
    subject,
    html: brandedActionEmailHtml({ heading, body, ctaLabel, ctaUrl, footerNote, sentTo: to }),
  });

  if (error) return { error: error.message };
  return { success: true };
}
