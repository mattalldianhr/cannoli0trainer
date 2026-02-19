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
