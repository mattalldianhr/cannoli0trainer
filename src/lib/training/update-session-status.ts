import { prisma } from '@/lib/prisma';
import { notifyWorkoutCompletion } from '@/lib/notifications';

/**
 * Recalculates and updates WorkoutSession completion status after a set is logged/updated/deleted.
 * Finds the session for the given athlete + workoutExercise's workout, counts completed exercises,
 * and updates the session's status, completionPercentage, and completedItems.
 * Sends an email notification to the coach on transition to FULLY_COMPLETED.
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

  const previousStatus = session.status;

  await prisma.workoutSession.update({
    where: { id: session.id },
    data: {
      status,
      completionPercentage,
      completedItems,
      totalItems,
    },
  });

  // Send email notification to coach on transition to FULLY_COMPLETED
  if (status === 'FULLY_COMPLETED' && previousStatus !== 'FULLY_COMPLETED') {
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: { name: true, coachId: true, coach: { select: { id: true, email: true, notificationPreferences: true } } },
    });

    if (athlete?.coachId) {
      // Fire-and-forget — don't await, don't block the response
      notifyWorkoutCompletion({
        coachId: athlete.coachId,
        coachEmail: athlete.coach?.email ?? '',
        athleteName: athlete.name,
        athleteId,
        workoutName: session.title || workout.name,
        completionPercent: completionPercentage,
        date: session.date?.toISOString() || new Date().toISOString(),
        notificationPreferences: athlete.coach?.notificationPreferences,
      }).catch(() => {
        // Silently ignore — notifyWorkoutCompletion already logs errors internally
      });
    }
  }
}
