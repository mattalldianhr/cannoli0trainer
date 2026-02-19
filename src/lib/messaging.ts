import { prisma } from '@/lib/prisma';
import { sendEmail, brandedEmailHtml, emailCtaButton, APP_URL } from '@/lib/email';

/**
 * Schedule a delayed email notification for an unread message.
 *
 * After 5 minutes, checks if the message is still unread. If so, sends an
 * email to the athlete. This is a simple setTimeout approach adequate for
 * v1 scale (~50 athletes). For production scale, replace with a job queue.
 *
 * Fire-and-forget — errors are logged but never thrown.
 */
export async function scheduleMessageNotification(
  messageId: string,
  athleteId: string
): Promise<void> {
  const DELAY_MS = 5 * 60 * 1000; // 5 minutes

  setTimeout(async () => {
    try {
      // Check if message is still unread
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: { readAt: true, content: true },
      });

      if (!message || message.readAt) {
        return; // Already read, skip
      }

      // Get athlete info and check notification preferences
      const athlete = await prisma.athlete.findUnique({
        where: { id: athleteId },
        select: {
          email: true,
          name: true,
          notificationPreferences: true,
        },
      });

      if (!athlete?.email) {
        return; // No email to notify
      }

      // Check mute preference
      const prefs = parseMessagePreferences(athlete.notificationPreferences);
      if (!prefs.emailOnMessage) {
        return; // Athlete muted message notifications
      }

      const preview =
        message.content.length > 200
          ? message.content.slice(0, 200) + '...'
          : message.content;

      await sendEmail({
        to: athlete.email,
        subject: 'New message from your coach',
        html: brandedEmailHtml({
          body: `
            <p style="font-size: 16px; color: #1f2937;">Hey ${athlete.name.split(' ')[0]},</p>
            <p style="font-size: 16px; color: #1f2937;">
              Your coach sent you a message:
            </p>
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="font-size: 14px; color: #374151; margin: 0; white-space: pre-wrap;">${preview}</p>
            </div>
            ${emailCtaButton('View Message', `${APP_URL}/athlete/messages`)}
          `,
        }),
      });
    } catch (error) {
      console.error('[messaging] Failed to send delayed notification:', error);
    }
  }, DELAY_MS);
}

/**
 * Parse athlete notification preferences for messaging.
 * Extends the existing preferences with emailOnMessage (default: true).
 */
function parseMessagePreferences(raw: unknown): { emailOnMessage: boolean } {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    return {
      emailOnMessage:
        typeof obj.emailOnMessage === 'boolean'
          ? obj.emailOnMessage
          : true,
    };
  }
  return { emailOnMessage: true };
}
