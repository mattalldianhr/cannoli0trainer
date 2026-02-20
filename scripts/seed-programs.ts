/**
 * Seed script: Create "Cannoli Strength Block" programs for Matt, Chris, and Michael.
 *
 * All 3 athletes run the same Mon/Thu/Sat program. This script:
 * 1. Looks up coach + athlete + exercise IDs
 * 2. Creates one Program per athlete with nested Workouts + WorkoutExercises
 * 3. Creates ProgramAssignments
 * 4. Generates a 4-week schedule and creates WorkoutSessions (idempotent)
 *
 * Run: npx tsx scripts/seed-programs.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- Config ---
const PROGRAM_NAME = 'Cannoli Strength Block';
const TRAINING_DAYS = [1, 4, 6]; // Mon, Thu, Sat
const START_DATE = new Date('2026-02-23'); // Next Monday
const NUM_WEEKS = 4;

const ATHLETE_NAMES = ['Matt Alldian', 'Chris Laakko', 'Michael Odermatt'];

const EXERCISE_NAMES = [
  'Barbell Squat',
  'Barbell Bench Press - Medium Grip',
  '1 Count Paused Bench',
  '3 Count Paused Bench',
  'Barbell Deadlift',
  'Romanian Deadlift',
  'One-Arm Dumbbell Row',
  'Inverted Row',
  'Heel Elevated Goblet Squat',
  'Dumbbell Bench Press',
  'Bicep Exercise of Choice',
  'Tricep Extension',
  'Leg Extensions',
];

// --- Workout Templates ---

interface ExerciseTemplate {
  exerciseName: string;
  order: number;
  prescriptionType: 'rpe' | 'rir' | 'fixed';
  prescribedSets: string;
  prescribedReps: string;
  prescribedRPE?: number;
  prescribedRIR?: number;
  prescribedLoad?: string;
  supersetGroup?: string;
  supersetColor?: string;
  notes?: string;
}

interface WorkoutTemplate {
  name: string;
  weekNumber: number;
  dayNumber: number;
  exercises: ExerciseTemplate[];
}

const MONDAY: WorkoutTemplate = {
  name: 'Squat & Paused Bench',
  weekNumber: 1,
  dayNumber: 1,
  exercises: [
    {
      exerciseName: 'Barbell Squat',
      order: 1,
      prescriptionType: 'rpe',
      prescribedSets: '4',
      prescribedReps: '3-5',
      prescribedRPE: 6,
      notes: 'Work up to RPE 6 triples, repeat. Drop 12% for backoffs',
    },
    {
      exerciseName: '1 Count Paused Bench',
      order: 2,
      prescriptionType: 'rpe',
      prescribedSets: '3',
      prescribedReps: '3-4',
      prescribedRPE: 6,
      notes: 'Work up to RPE 6, repeat for two more',
    },
    {
      exerciseName: '1 Count Paused Bench',
      order: 3,
      prescriptionType: 'rpe',
      prescribedSets: '2',
      prescribedReps: '6',
      prescribedRPE: 7,
      notes: 'Drop 6% from top',
    },
    {
      exerciseName: 'Leg Extensions',
      order: 4,
      prescriptionType: 'rpe',
      prescribedSets: '3',
      prescribedReps: '12',
      prescribedRPE: 7,
    },
    {
      exerciseName: 'Tricep Extension',
      order: 5,
      prescriptionType: 'rpe',
      prescribedSets: '3',
      prescribedReps: '15',
      prescribedRPE: 7,
      supersetGroup: 'A',
      supersetColor: '#f97316',
    },
    {
      exerciseName: 'Bicep Exercise of Choice',
      order: 6,
      prescriptionType: 'rpe',
      prescribedSets: '3',
      prescribedReps: '15',
      prescribedRPE: 7,
      supersetGroup: 'A',
      supersetColor: '#f97316',
    },
  ],
};

const THURSDAY: WorkoutTemplate = {
  name: 'Bench & Deadlift',
  weekNumber: 1,
  dayNumber: 2,
  exercises: [
    {
      exerciseName: '3 Count Paused Bench',
      order: 1,
      prescriptionType: 'rpe',
      prescribedSets: '3',
      prescribedReps: '3',
      prescribedRPE: 6,
      notes: 'RPE 6, repeat for 2 more',
    },
    {
      exerciseName: 'Barbell Bench Press - Medium Grip',
      order: 2,
      prescriptionType: 'rir',
      prescribedSets: '2',
      prescribedReps: '5-8',
      prescribedRIR: 3,
      notes: 'Drop 15% from paused work, 2 sets to 3-2 RIR',
    },
    {
      exerciseName: 'Barbell Deadlift',
      order: 3,
      prescriptionType: 'rpe',
      prescribedSets: '4',
      prescribedReps: '3-5',
      prescribedRPE: 6,
      notes: 'RPE 6, repeat. Drop 12% for backoff sets',
    },
    {
      exerciseName: 'Romanian Deadlift',
      order: 4,
      prescriptionType: 'rpe',
      prescribedSets: '2',
      prescribedReps: '10-12',
      prescribedRPE: 7,
    },
    {
      exerciseName: 'Inverted Row',
      order: 5,
      prescriptionType: 'rpe',
      prescribedSets: '2',
      prescribedReps: '6-8',
      prescribedRPE: 7,
    },
    {
      exerciseName: 'One-Arm Dumbbell Row',
      order: 6,
      prescriptionType: 'rpe',
      prescribedSets: '3',
      prescribedReps: '8',
      prescribedRPE: 7,
    },
  ],
};

const SATURDAY: WorkoutTemplate = {
  name: 'Light SBD + Accessories',
  weekNumber: 1,
  dayNumber: 3,
  exercises: [
    {
      exerciseName: 'Barbell Squat',
      order: 1,
      prescriptionType: 'rpe',
      prescribedSets: '3',
      prescribedReps: '8',
      prescribedRPE: 6,
      notes: 'RPE 5-6',
    },
    {
      exerciseName: 'Barbell Bench Press - Medium Grip',
      order: 2,
      prescriptionType: 'rpe',
      prescribedSets: '3',
      prescribedReps: '6',
      prescribedRPE: 6,
    },
    {
      exerciseName: 'Heel Elevated Goblet Squat',
      order: 3,
      prescriptionType: 'rpe',
      prescribedSets: '3',
      prescribedReps: '8',
      prescribedRPE: 7,
    },
    {
      exerciseName: 'Dumbbell Bench Press',
      order: 4,
      prescriptionType: 'rpe',
      prescribedSets: '2',
      prescribedReps: '8',
      prescribedRPE: 7,
      notes: 'RPE 6-7',
    },
    {
      exerciseName: 'Bicep Exercise of Choice',
      order: 5,
      prescriptionType: 'rpe',
      prescribedSets: '3',
      prescribedReps: '12',
      prescribedRPE: 7,
    },
  ],
};

const WORKOUT_TEMPLATES = [MONDAY, THURSDAY, SATURDAY];

// --- Schedule Generation (inline, mirrors src/lib/scheduling/generate-schedule.ts) ---

interface ScheduledSession {
  date: Date;
  workoutId: string;
  weekNumber: number;
  dayNumber: number;
  title: string;
}

function generateSchedule(
  workouts: { id: string; weekNumber: number; dayNumber: number; name: string }[],
  startDate: Date,
  trainingDays: number[],
  numWeeks: number
): ScheduledSession[] {
  const sessions: ScheduledSession[] = [];

  // Sort training days Mon-first
  const sortedDays = [...trainingDays].sort((a, b) => {
    const oa = a === 0 ? 6 : a - 1;
    const ob = b === 0 ? 6 : b - 1;
    return oa - ob;
  });

  // Sort workouts by week then day
  const sorted = [...workouts].sort((a, b) =>
    a.weekNumber !== b.weekNumber ? a.weekNumber - b.weekNumber : a.dayNumber - b.dayNumber
  );

  // Get Monday of the start week
  const day = startDate.getDay();
  const diff = day === 0 ? 6 : day - 1;
  let weekStart = new Date(startDate);
  weekStart.setDate(weekStart.getDate() - diff);
  weekStart.setHours(0, 0, 0, 0);

  for (let week = 0; week < numWeeks; week++) {
    for (let i = 0; i < sorted.length; i++) {
      const workout = sorted[i];
      const dayOfWeek = sortedDays[i % sortedDays.length];
      const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const date = new Date(weekStart);
      date.setDate(date.getDate() + offset);
      date.setHours(0, 0, 0, 0);

      sessions.push({
        date,
        workoutId: workout.id,
        weekNumber: week + 1,
        dayNumber: workout.dayNumber,
        title: workout.name,
      });
    }
    // Advance to next week
    weekStart = new Date(weekStart);
    weekStart.setDate(weekStart.getDate() + 7);
  }

  return sessions;
}

// --- Main ---

async function main() {
  console.log('=== Seeding Programs ===\n');

  // 1. Look up coach
  const coach = await prisma.coach.findFirst({ where: { email: 'cannoli.strength@gmail.com' } });
  if (!coach) throw new Error('Coach not found (cannoli.strength@gmail.com)');
  console.log(`Coach: ${coach.name} (${coach.id})`);

  // 2. Look up athletes
  const athletes = await prisma.athlete.findMany({
    where: { name: { in: ATHLETE_NAMES }, coachId: coach.id },
    select: { id: true, name: true },
  });
  if (athletes.length !== ATHLETE_NAMES.length) {
    const found = athletes.map((a) => a.name);
    const missing = ATHLETE_NAMES.filter((n) => !found.includes(n));
    throw new Error(`Missing athletes: ${missing.join(', ')}`);
  }
  for (const a of athletes) console.log(`  Athlete: ${a.name} (${a.id})`);

  // 3. Look up exercises
  const exercises = await prisma.exercise.findMany({
    where: { name: { in: EXERCISE_NAMES } },
    select: { id: true, name: true },
  });
  const exerciseMap = new Map(exercises.map((e) => [e.name, e.id]));

  // Check for missing exercises — create any that don't exist
  const missing = EXERCISE_NAMES.filter((n) => !exerciseMap.has(n));
  if (missing.length > 0) {
    console.log(`\n  Creating ${missing.length} missing exercises...`);
    for (const name of missing) {
      const created = await prisma.exercise.create({
        data: {
          name,
          category: 'strength',
          coachId: coach.id,
        },
      });
      exerciseMap.set(name, created.id);
      console.log(`    Created: ${name} (${created.id})`);
    }
  }
  console.log(`\n  All ${EXERCISE_NAMES.length} exercises resolved.`);

  // 4. Create programs for each athlete
  for (const athlete of athletes) {
    console.log(`\n--- ${athlete.name} ---`);

    // Check if program already exists for this athlete
    const existing = await prisma.program.findFirst({
      where: { coachId: coach.id, name: PROGRAM_NAME, assignments: { some: { athleteId: athlete.id } } },
      include: { workouts: true },
    });
    if (existing) {
      console.log(`  Program already exists (${existing.id}), skipping creation.`);
      continue;
    }

    // Create program with nested workouts + exercises
    const program = await prisma.program.create({
      data: {
        coachId: coach.id,
        name: PROGRAM_NAME,
        description: '3-day powerlifting block: Mon (Squat & Paused Bench), Thu (Bench & Deadlift), Sat (Light SBD + Accessories)',
        type: 'individual',
        startDate: START_DATE,
        workouts: {
          create: WORKOUT_TEMPLATES.map((wt) => ({
            name: wt.name,
            weekNumber: wt.weekNumber,
            dayNumber: wt.dayNumber,
            exercises: {
              create: wt.exercises.map((ex) => ({
                exerciseId: exerciseMap.get(ex.exerciseName)!,
                order: ex.order,
                prescriptionType: ex.prescriptionType,
                prescribedSets: ex.prescribedSets,
                prescribedReps: ex.prescribedReps,
                prescribedRPE: ex.prescribedRPE,
                prescribedRIR: ex.prescribedRIR,
                prescribedLoad: ex.prescribedLoad,
                supersetGroup: ex.supersetGroup,
                supersetColor: ex.supersetColor,
                notes: ex.notes,
              })),
            },
          })),
        },
      },
      include: { workouts: { include: { exercises: true } } },
    });
    console.log(`  Program created: ${program.id}`);
    for (const w of program.workouts) {
      console.log(`    Workout: ${w.name} (W${w.weekNumber}D${w.dayNumber}) — ${w.exercises.length} exercises`);
    }

    // Create assignment
    const assignment = await prisma.programAssignment.create({
      data: {
        programId: program.id,
        athleteId: athlete.id,
        startDate: START_DATE,
        trainingDays: TRAINING_DAYS,
        isActive: true,
      },
    });
    console.log(`  Assignment: ${assignment.id}`);

    // Generate schedule
    const workoutInputs = program.workouts.map((w) => ({
      id: w.id,
      weekNumber: w.weekNumber,
      dayNumber: w.dayNumber,
      name: w.name,
    }));
    const schedule = generateSchedule(workoutInputs, START_DATE, TRAINING_DAYS, NUM_WEEKS);

    // Persist sessions (idempotent — skip existing dates)
    const scheduleDates = schedule.map((s) => s.date);
    const existingSessions = await prisma.workoutSession.findMany({
      where: { athleteId: athlete.id, date: { in: scheduleDates } },
      select: { date: true },
    });
    const existingDateSet = new Set(
      existingSessions.map((s) => s.date.toISOString().split('T')[0])
    );

    const toCreate = schedule.filter(
      (s) => !existingDateSet.has(s.date.toISOString().split('T')[0])
    );
    const skipped = schedule.length - toCreate.length;

    if (toCreate.length > 0) {
      // Count exercises per workout for totalItems
      const exerciseCountMap = new Map(
        program.workouts.map((w) => [w.id, w.exercises.length])
      );

      await prisma.$transaction(
        toCreate.map((session) =>
          prisma.workoutSession.create({
            data: {
              athleteId: athlete.id,
              date: session.date,
              programId: program.id,
              programAssignmentId: assignment.id,
              workoutId: session.workoutId,
              title: session.title,
              weekNumber: session.weekNumber,
              dayNumber: session.dayNumber,
              status: 'NOT_STARTED',
              totalItems: exerciseCountMap.get(session.workoutId) ?? 0,
              completedItems: 0,
              completionPercentage: 0,
            },
          })
        )
      );
    }
    console.log(`  Sessions: ${toCreate.length} created, ${skipped} skipped (${schedule.length} total)`);
  }

  console.log('\n=== Done ===');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
