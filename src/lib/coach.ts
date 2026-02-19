import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * Get the current coach's ID from the authenticated session.
 *
 * Falls back to the first coach in the database during migration
 * (logs a warning when fallback is used).
 *
 * @throws Error if no coach exists in the database
 */
export async function getCurrentCoachId(): Promise<string> {
  const session = await auth();

  if (session?.user?.coachId) {
    return session.user.coachId;
  }

  // Fallback during migration: return first coach
  console.warn(
    '[getCurrentCoachId] No coachId in session — falling back to first coach. ' +
    'This should only happen during auth migration.'
  );

  const coach = await prisma.coach.findFirst({
    select: { id: true },
  });

  if (!coach) {
    throw new Error('No coach found in database. Run `npx prisma db seed` to create one.');
  }

  return coach.id;
}

const DEFAULT_TIMEZONE = "America/New_York";

/** Get the coach's IANA timezone (defaults to America/New_York). */
export async function getCoachTimezone(coachId?: string): Promise<string> {
  const id = coachId || await getCurrentCoachId();
  const coach = await prisma.coach.findUnique({
    where: { id },
    select: { timezone: true },
  });
  return coach?.timezone || DEFAULT_TIMEZONE;
}

/** For athlete routes: get the coach's timezone via athlete's coachId. */
export async function getAthleteCoachTimezone(athleteId: string): Promise<string> {
  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
    select: { coach: { select: { timezone: true } } },
  });
  return athlete?.coach?.timezone || DEFAULT_TIMEZONE;
}
