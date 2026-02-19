import sgMail from '@sendgrid/mail';

// ---------------------------------------------------------------------------
// SendGrid singleton — lazily initialized, returns false when no API key
// ---------------------------------------------------------------------------

let _initialized = false;

function initSendGrid(): boolean {
  const key = process.env.SENDGRID_API_KEY || process.env.AUTH_RESEND_KEY;
  if (!key) return false;
  if (!_initialized) {
    sgMail.setApiKey(key);
    _initialized = true;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const EMAIL_FROM =
  process.env.EMAIL_FROM || 'Cannoli Trainer <noreply@cannoli.mattalldian.com>';
const APP_URL = process.env.AUTH_URL || 'http://localhost:3000';

export { APP_URL };

// ---------------------------------------------------------------------------
// Low-level send — wraps SendGrid SDK. Logs errors, never throws.
// ---------------------------------------------------------------------------

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!initSendGrid()) {
    console.warn('[email] SENDGRID_API_KEY not set, skipping email');
    return false;
  }

  try {
    await sgMail.send({ from: EMAIL_FROM, to, subject, html });
    console.log(`[email] Sent "${subject}" to ${to}`);
    return true;
  } catch (error) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Branded email template — Cannoli Strength orange header + footer
// ---------------------------------------------------------------------------

export function brandedEmailHtml({
  body,
}: {
  body: string;
}): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f97316; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Cannoli Trainer</h1>
      </div>
      <div style="padding: 32px 24px;">
        ${body}
      </div>
      <div style="background-color: #f3f4f6; padding: 16px 24px; text-align: center;">
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">
          Cannoli Trainer &mdash; Cannoli Strength
        </p>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Helper: CTA button block (centered, branded)
// ---------------------------------------------------------------------------

export function emailCtaButton(label: string, url: string): string {
  return `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${url}" style="background-color: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">
        ${label}
      </a>
    </div>
  `;
}
