import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const mattId = '470789fd-685e-48b2-a49f-0ca471b584a6';
  const programId = '11241c8c-8c50-4667-806d-8b4e25d79288';
  const title = 'Thursday Strength';

  // Get exercise IDs
  const exercises = await prisma.exercise.findMany({
    where: {
      name: {
        in: [
          'Barbell Squat',
          'Barbell Bench Press - Medium Grip',
          'Front Foot Elevated Split Squat',
        ],
      },
    },
    select: { id: true, name: true },
  });

  for (const e of exercises) console.log(e.name, '->', e.id);

  const sqId = exercises.find((e) => e.name === 'Barbell Squat')?.id;
  const bnId = exercises.find(
    (e) => e.name === 'Barbell Bench Press - Medium Grip'
  )?.id;
  const ssId = exercises.find(
    (e) => e.name === 'Front Foot Elevated Split Squat'
  )?.id;

  if (!sqId || !bnId || !ssId) {
    console.error('Missing exercises');
    return;
  }

  // Create workout + exercises in one transaction
  const workout = await prisma.workout.create({
    data: {
      programId,
      name: title,
      weekNumber: 1,
      dayNumber: 4,
      exercises: {
        create: [
          {
            order: 1,
            exerciseId: sqId,
            prescriptionType: 'rpe',
            prescribedSets: '1',
            prescribedReps: '2',
            prescribedRPE: 8,
            notes: 'Work up to RPE 8 double',
          },
          {
            order: 2,
            exerciseId: sqId,
            prescriptionType: 'fixed',
            prescribedSets: '4',
            prescribedReps: '3',
            prescribedLoad: '70',
            notes: 'Backoff sets @ ~85% of top',
          },
          {
            order: 3,
            exerciseId: bnId,
            prescriptionType: 'rpe',
            prescribedSets: '2',
            prescribedReps: '2',
            prescribedRPE: 8,
            notes: 'Work up to RPE 8 doubles',
          },
          {
            order: 4,
            exerciseId: bnId,
            prescriptionType: 'fixed',
            prescribedSets: '4',
            prescribedReps: '3',
            prescribedLoad: '40',
            notes: 'Backoff sets @ ~70% of top',
          },
          {
            order: 5,
            exerciseId: ssId,
            prescriptionType: 'rpe',
            prescribedSets: '3',
            prescribedReps: '8',
            prescribedRPE: 7,
            restTimeSeconds: 90,
            notes: 'BW or light DB',
          },
        ],
      },
    },
  });
  console.log('Workout created:', workout.id);

  // Update session to point to new workout
  await prisma.workoutSession.update({
    where: {
      athleteId_date: { athleteId: mattId, date: new Date('2026-02-19') },
    },
    data: {
      workoutId: workout.id,
      title,
      totalItems: 5,
      completedItems: 0,
      completionPercentage: 0,
      status: 'NOT_STARTED',
    },
  });
  console.log('Session updated for 2026-02-19 with', title);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
