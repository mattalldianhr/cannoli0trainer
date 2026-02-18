import { sendEmail, brandedEmailHtml, emailCtaButton, APP_URL } from '@/lib/email';

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
  if (!athleteEmail) {
    console.warn('[notifications] No email for athlete, skipping program assignment email');
    return;
  }

  const startDateText = startDate
    ? `starting ${new Date(startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`
    : '';

  const trainUrl = `${APP_URL}/athlete/train`;

  await sendEmail({
    to: athleteEmail,
    subject: `New program assigned: ${programName}`,
    html: brandedEmailHtml({
      body: `
        <p style="font-size: 16px; color: #1f2937;">Hey ${athleteName},</p>
        <p style="font-size: 16px; color: #1f2937;">
          Your coach has assigned you a new program: <strong>${programName}</strong>${startDateText ? ` ${startDateText}` : ''}.
        </p>
        ${emailCtaButton('View Your Program', trainUrl)}
        <p style="font-size: 14px; color: #6b7280;">
          Open Cannoli Trainer to see your workouts and start training.
        </p>
      `,
    }),
  });
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

  await sendEmail({
    to: coachEmail,
    subject: `${athleteName} completed ${workoutName}`,
    html: brandedEmailHtml({
      body: `
        <p style="font-size: 16px; color: #1f2937;">
          <strong>${athleteName}</strong> completed <strong>${workoutName}</strong> on ${dateText}.
        </p>
        <p style="font-size: 16px; color: #1f2937;">
          Completion: <strong>${completionPercent}%</strong>
        </p>
        ${emailCtaButton('View Athlete', athleteUrl)}
      `,
    }),
  });
}
