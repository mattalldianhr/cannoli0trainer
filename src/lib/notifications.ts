import { sendEmail, brandedEmailHtml, emailCtaButton, APP_URL } from '@/lib/email';
import { prisma } from '@/lib/prisma';

/**
 * Send email notification and create Notification DB record when a program is assigned.
 * Fire-and-forget — errors are logged but never thrown.
 */
export async function notifyProgramAssignment({
  athleteId,
  athleteEmail,
  athleteName,
  programName,
  startDate,
}: {
  athleteId: string;
  athleteEmail: string;
  athleteName: string;
  programName: string;
  startDate?: string | null;
}) {
  const title = `New program assigned: ${programName}`;
  const startDateText = startDate
    ? `starting ${new Date(startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`
    : '';
  const body = `Your coach has assigned you a new program: ${programName}${startDateText ? ` ${startDateText}` : ''}.`;

  // Always create the DB record (for future in-app notification support)
  try {
    await prisma.notification.create({
      data: {
        recipientId: athleteId,
        recipientType: 'ATHLETE',
        type: 'PROGRAM_ASSIGNED',
        title,
        body,
      },
    });
  } catch (error) {
    console.error('[notifications] Failed to create PROGRAM_ASSIGNED notification record:', error);
  }

  // Send email (skip if no email address)
  if (!athleteEmail) {
    console.warn('[notifications] No email for athlete, skipping program assignment email');
    return;
  }

  const trainUrl = `${APP_URL}/athlete/train`;

  await sendEmail({
    to: athleteEmail,
    subject: title,
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
 * Send email notification and create Notification DB record when a workout is completed.
 * Fire-and-forget — errors are logged but never thrown.
 */
export async function notifyWorkoutCompletion({
  coachId,
  coachEmail,
  athleteName,
  athleteId,
  workoutName,
  completionPercent,
  date,
}: {
  coachId: string;
  coachEmail: string;
  athleteName: string;
  athleteId: string;
  workoutName: string;
  completionPercent: number;
  date: string;
}) {
  const title = `${athleteName} completed ${workoutName}`;
  const dateText = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const body = `${athleteName} completed ${workoutName} on ${dateText}. Completion: ${completionPercent}%.`;

  // Always create the DB record (for future in-app notification support)
  try {
    await prisma.notification.create({
      data: {
        recipientId: coachId,
        recipientType: 'COACH',
        type: 'WORKOUT_COMPLETED',
        title,
        body,
      },
    });
  } catch (error) {
    console.error('[notifications] Failed to create WORKOUT_COMPLETED notification record:', error);
  }

  // Send email (skip if no email address)
  if (!coachEmail) {
    console.warn('[notifications] No coach email, skipping workout completion email');
    return;
  }

  const athleteUrl = `${APP_URL}/athletes/${athleteId}`;

  await sendEmail({
    to: coachEmail,
    subject: title,
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
