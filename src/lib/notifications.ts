import { sendEmail, brandedEmailHtml, emailCtaButton, APP_URL } from '@/lib/email';
import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// Notification preference types & helpers
// ---------------------------------------------------------------------------

export interface CoachNotificationPreferences {
  emailOnWorkoutComplete: boolean;
  emailOnCheckIn: boolean;
}

export interface AthleteNotificationPreferences {
  emailOnProgramAssigned: boolean;
}

const DEFAULT_COACH_PREFS: CoachNotificationPreferences = {
  emailOnWorkoutComplete: true,
  emailOnCheckIn: true,
};

const DEFAULT_ATHLETE_PREFS: AthleteNotificationPreferences = {
  emailOnProgramAssigned: true,
};

/** Parse a Json field into typed coach preferences, falling back to defaults. */
export function parseCoachPreferences(raw: unknown): CoachNotificationPreferences {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    return {
      emailOnWorkoutComplete:
        typeof obj.emailOnWorkoutComplete === 'boolean'
          ? obj.emailOnWorkoutComplete
          : DEFAULT_COACH_PREFS.emailOnWorkoutComplete,
      emailOnCheckIn:
        typeof obj.emailOnCheckIn === 'boolean'
          ? obj.emailOnCheckIn
          : DEFAULT_COACH_PREFS.emailOnCheckIn,
    };
  }
  return { ...DEFAULT_COACH_PREFS };
}

/** Parse a Json field into typed athlete preferences, falling back to defaults. */
export function parseAthletePreferences(raw: unknown): AthleteNotificationPreferences {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    return {
      emailOnProgramAssigned:
        typeof obj.emailOnProgramAssigned === 'boolean'
          ? obj.emailOnProgramAssigned
          : DEFAULT_ATHLETE_PREFS.emailOnProgramAssigned,
    };
  }
  return { ...DEFAULT_ATHLETE_PREFS };
}

// ---------------------------------------------------------------------------
// PROGRAM_ASSIGNED notification (coach -> athlete)
// ---------------------------------------------------------------------------

/**
 * Create Notification DB record and optionally send email when a program is assigned.
 * Fire-and-forget — errors are logged but never thrown.
 */
export async function notifyProgramAssignment({
  athleteId,
  athleteEmail,
  athleteName,
  programName,
  startDate,
  notificationPreferences,
}: {
  athleteId: string;
  athleteEmail: string;
  athleteName: string;
  programName: string;
  startDate?: string | null;
  notificationPreferences?: unknown;
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

  // Check athlete email preference
  const prefs = parseAthletePreferences(notificationPreferences);
  if (!prefs.emailOnProgramAssigned) {
    console.log('[notifications] Athlete opted out of program assignment emails, skipping');
    return;
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

// ---------------------------------------------------------------------------
// WORKOUT_COMPLETED notification (athlete -> coach)
// ---------------------------------------------------------------------------

/**
 * Create Notification DB record and optionally send email when a workout is completed.
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
  notificationPreferences,
}: {
  coachId: string;
  coachEmail: string;
  athleteName: string;
  athleteId: string;
  workoutName: string;
  completionPercent: number;
  date: string;
  notificationPreferences?: unknown;
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

  // Check coach email preference
  const prefs = parseCoachPreferences(notificationPreferences);
  if (!prefs.emailOnWorkoutComplete) {
    console.log('[notifications] Coach opted out of workout completion emails, skipping');
    return;
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
