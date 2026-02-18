import { prisma } from '@/lib/prisma';

/**
 * Recalculates and updates WorkoutSession completion status after a set is logged/updated/deleted.
 * Finds the session for the given athlete + workoutExercise's workout, counts completed exercises,
 * and updates the session's status, completionPercentage, and completedItems.
 */
export async function updateSessionStatus(workoutExerciseId: string, athleteId: string) {
  // Find the workout that owns this exercise
  const workoutExercise = await prisma.workoutExercise.findUnique({
    where: { id: workoutExerciseId },
    select: {
      workout: {
        select: {
          id: true,
          name: true,
          programId: true,
          exercises: {
            select: {
              id: true,
              prescribedSets: true,
              setLogs: {
                where: { athleteId },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  if (!workoutExercise?.workout) return;

  const workout = workoutExercise.workout;
  const totalItems = workout.exercises.length;

  // An exercise is "complete" when it has at least prescribedSets logged
  let completedItems = 0;
  for (const ex of workout.exercises) {
    const prescribed = ex.prescribedSets ? parseInt(ex.prescribedSets, 10) : 0;
    if (prescribed > 0 && ex.setLogs.length >= prescribed) {
      completedItems++;
    }
  }

  const completionPercentage = totalItems > 0
    ? Math.round((completedItems / totalItems) * 100)
    : 0;

  let status: 'NOT_STARTED' | 'PARTIALLY_COMPLETED' | 'FULLY_COMPLETED';
  if (completedItems === 0) {
    // Check if any sets exist at all
    const anyLogs = workout.exercises.some((ex) => ex.setLogs.length > 0);
    status = anyLogs ? 'PARTIALLY_COMPLETED' : 'NOT_STARTED';
  } else if (completedItems >= totalItems) {
    status = 'FULLY_COMPLETED';
  } else {
    status = 'PARTIALLY_COMPLETED';
  }

  // Find the session for this athlete + workout
  // Sessions are linked by programId + title (matching the workout name)
  if (!workout.programId) return;

  // Find session by looking at the athlete's sessions for this program with matching title
  const session = await prisma.workoutSession.findFirst({
    where: {
      athleteId,
      programId: workout.programId,
      title: workout.name,
    },
  });

  if (!session) return;

  await prisma.workoutSession.update({
    where: { id: session.id },
    data: {
      status,
      completionPercentage,
      completedItems,
      totalItems,
    },
  });
}
