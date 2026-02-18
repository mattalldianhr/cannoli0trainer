import { Resend } from 'resend';

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.AUTH_RESEND_KEY) return null;
  if (!_resend) {
    _resend = new Resend(process.env.AUTH_RESEND_KEY);
  }
  return _resend;
}

const EMAIL_FROM = process.env.EMAIL_FROM || 'Cannoli Trainer <noreply@cannoli.mattalldian.com>';
const APP_URL = process.env.AUTH_URL || 'http://localhost:3000';

/**
 * Send email notification when a program is assigned to an athlete.
 * Fire-and-forget — errors are logged but never thrown.
 */
export async function notifyProgramAssignment({
  athleteEmail,
  athleteName,
  programName,
  startDate,
}: {
  athleteEmail: string;
  athleteName: string;
  programName: string;
  startDate?: string | null;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn('[notifications] AUTH_RESEND_KEY not set, skipping program assignment email');
    return;
  }

  if (!athleteEmail) {
    console.warn('[notifications] No email for athlete, skipping program assignment email');
    return;
  }

  const startDateText = startDate
    ? `starting ${new Date(startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`
    : '';

  const trainUrl = `${APP_URL}/athlete/train`;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: athleteEmail,
      subject: `New program assigned: ${programName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f97316; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Cannoli Trainer</h1>
          </div>
          <div style="padding: 32px 24px;">
            <p style="font-size: 16px; color: #1f2937;">Hey ${athleteName},</p>
            <p style="font-size: 16px; color: #1f2937;">
              Your coach has assigned you a new program: <strong>${programName}</strong>${startDateText ? ` ${startDateText}` : ''}.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${trainUrl}" style="background-color: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">
                View Your Program
              </a>
            </div>
            <p style="font-size: 14px; color: #6b7280;">
              Open Cannoli Trainer to see your workouts and start training.
            </p>
          </div>
          <div style="background-color: #f3f4f6; padding: 16px 24px; text-align: center;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              Cannoli Trainer &mdash; Cannoli Strength
            </p>
          </div>
        </div>
      `,
    });
    console.log(`[notifications] Program assignment email sent to ${athleteEmail}`);
  } catch (error) {
    console.error('[notifications] Failed to send program assignment email:', error);
  }
}

/**
 * Send email notification to coach when an athlete completes a workout.
 * Fire-and-forget — errors are logged but never thrown.
 */
export async function notifyWorkoutCompletion({
  coachEmail,
  athleteName,
  athleteId,
  workoutName,
  completionPercent,
  date,
}: {
  coachEmail: string;
  athleteName: string;
  athleteId: string;
  workoutName: string;
  completionPercent: number;
  date: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn('[notifications] AUTH_RESEND_KEY not set, skipping workout completion email');
    return;
  }

  if (!coachEmail) {
    console.warn('[notifications] No coach email, skipping workout completion email');
    return;
  }

  const athleteUrl = `${APP_URL}/athletes/${athleteId}`;
  const dateText = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: coachEmail,
      subject: `${athleteName} completed ${workoutName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f97316; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Cannoli Trainer</h1>
          </div>
          <div style="padding: 32px 24px;">
            <p style="font-size: 16px; color: #1f2937;">
              <strong>${athleteName}</strong> completed <strong>${workoutName}</strong> on ${dateText}.
            </p>
            <p style="font-size: 16px; color: #1f2937;">
              Completion: <strong>${completionPercent}%</strong>
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${athleteUrl}" style="background-color: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">
                View Athlete
              </a>
            </div>
          </div>
          <div style="background-color: #f3f4f6; padding: 16px 24px; text-align: center;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              Cannoli Trainer &mdash; Cannoli Strength
            </p>
          </div>
        </div>
      `,
    });
    console.log(`[notifications] Workout completion email sent to ${coachEmail}`);
  } catch (error) {
    console.error('[notifications] Failed to send workout completion email:', error);
  }
}
