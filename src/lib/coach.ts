import { prisma } from '@/lib/prisma';

/**
 * Get the current coach's ID.
 *
 * For now, this returns the first (and only) coach in the system.
 * When auth is added, this should derive coachId from the authenticated session.
 *
 * @throws Error if no coach exists in the database
 */
export async function getCurrentCoachId(): Promise<string> {
  const coach = await prisma.coach.findFirst({
    select: { id: true },
  });

  if (!coach) {
    throw new Error('No coach found in database. Run `npx prisma db seed` to create one.');
  }

  return coach.id;
}
