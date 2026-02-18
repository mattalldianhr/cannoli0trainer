/**
 * Integration test: Full assignment-to-train flow
 *
 * End-to-end test that verifies:
 * 1. Create a program with workouts and exercises
 * 2. Assign it to an athlete (generates WorkoutSessions via scheduling)
 * 3. Verify WorkoutSessions are created on correct dates
 * 4. Query /api/train logic for a scheduled date
 * 5. Verify the correct workout and exercises are returned
 *
 * Prerequisites:
 * - PostgreSQL running with DATABASE_URL configured
 * - Database seeded: `npx prisma db seed`
 *
 * Run with: npx vitest run src/lib/scheduling/__tests__/assignment-to-train.integration.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { generateSchedule, type WorkoutInput } from '../generate-schedule';
import { persistSchedule } from '../persist-schedule';

const prisma = new PrismaClient();

// Test state
let coachId: string;
let athleteId: string;
let programId: string;
let exerciseIds: string[] = [];
let assignmentId: string;

// Dates: use a known future Monday to avoid collisions with seeded data
// 2027-03-01 is a Monday
const START_DATE = new Date(2027, 2, 1); // March 1, 2027 (Monday)
const TRAINING_DAYS = [1, 2, 4, 5]; // Mon/Tue/Thu/Fri

beforeAll(async () => {
  // Get the seeded coach
  const coach = await prisma.coach.findFirst({
    where: { email: 'joe@cannolistrength.com' },
  });
  if (!coach) {
    throw new Error('Coach not found in database. Run `npx prisma db seed` first.');
  }
  coachId = coach.id;

  // Create a test athlete (separate from seeded athletes to avoid data collisions)
  const athlete = await prisma.athlete.create({
    data: {
      coachId,
      name: 'Integration Test Athlete',
      email: 'integration-test@example.com',
    },
  });
  athleteId = athlete.id;

  // Get two exercises from the library for the test program
  const exercises = await prisma.exercise.findMany({
    where: { category: 'strength' },
    take: 2,
    orderBy: { name: 'asc' },
  });
  if (exercises.length < 2) {
    throw new Error('Need at least 2 exercises in the database for this test.');
  }
  exerciseIds = exercises.map((e) => e.id);
});

afterAll(async () => {
  // Clean up in reverse dependency order
  // 1. Delete WorkoutSessions for the test athlete
  await prisma.workoutSession.deleteMany({
    where: { athleteId },
  });

  // 2. Delete ProgramAssignments
  await prisma.programAssignment.deleteMany({
    where: { athleteId },
  });

  // 3. Delete the program (cascades to Workouts -> WorkoutExercises)
  if (programId) {
    await prisma.program.delete({ where: { id: programId } }).catch(() => {});
  }

  // 4. Delete the test athlete
  await prisma.athlete.delete({ where: { id: athleteId } }).catch(() => {});

  await prisma.$disconnect();
});

// ============================================================
// Step 1: Create program with workouts and exercises
// ============================================================

describe('Full assignment-to-train integration flow', () => {
  it('should create a 2-week, 3-day program with exercises', async () => {
    // Create program
    const program = await prisma.program.create({
      data: {
        coachId,
        name: 'Integration Test Program',
      },
    });
    programId = program.id;

    // Create 6 workouts (2 weeks x 3 days)
    const workoutData = [
      { weekNumber: 1, dayNumber: 1, name: 'Week 1 - Heavy Squat' },
      { weekNumber: 1, dayNumber: 2, name: 'Week 1 - Heavy Bench' },
      { weekNumber: 1, dayNumber: 3, name: 'Week 1 - Heavy Deadlift' },
      { weekNumber: 2, dayNumber: 1, name: 'Week 2 - Volume Squat' },
      { weekNumber: 2, dayNumber: 2, name: 'Week 2 - Volume Bench' },
      { weekNumber: 2, dayNumber: 3, name: 'Week 2 - Volume Deadlift' },
    ];

    for (const wd of workoutData) {
      const workout = await prisma.workout.create({
        data: {
          programId: program.id,
          ...wd,
        },
      });

      // Add exercises to each workout
      await prisma.workoutExercise.create({
        data: {
          workoutId: workout.id,
          exerciseId: exerciseIds[0],
          order: 1,
          prescriptionType: 'fixed',
          prescribedSets: '4',
          prescribedReps: '5',
          prescribedLoad: '100',
        },
      });
      await prisma.workoutExercise.create({
        data: {
          workoutId: workout.id,
          exerciseId: exerciseIds[1],
          order: 2,
          prescriptionType: 'rpe',
          prescribedSets: '3',
          prescribedReps: '8',
          prescribedRPE: 8.0,
        },
      });
    }

    // Verify program structure
    const fullProgram = await prisma.program.findUnique({
      where: { id: program.id },
      include: {
        workouts: {
          include: { exercises: true },
          orderBy: [{ weekNumber: 'asc' }, { dayNumber: 'asc' }],
        },
      },
    });

    expect(fullProgram).not.toBeNull();
    expect(fullProgram!.workouts).toHaveLength(6);
    expect(fullProgram!.workouts[0].exercises).toHaveLength(2);
    expect(fullProgram!.workouts[0].name).toBe('Week 1 - Heavy Squat');
  });

  // ============================================================
  // Step 2: Assign program to athlete (generates schedule)
  // ============================================================

  it('should assign the program and generate 6 WorkoutSessions on correct dates', async () => {
    // Create the program assignment
    const assignment = await prisma.programAssignment.create({
      data: {
        programId,
        athleteId,
        startDate: START_DATE,
        trainingDays: TRAINING_DAYS,
      },
    });
    assignmentId = assignment.id;

    // Fetch workouts for schedule generation
    const workouts = await prisma.workout.findMany({
      where: { programId },
      select: { id: true, weekNumber: true, dayNumber: true, name: true },
      orderBy: [{ weekNumber: 'asc' }, { dayNumber: 'asc' }],
    });

    const workoutInputs: WorkoutInput[] = workouts.map((w) => ({
      id: w.id,
      weekNumber: w.weekNumber,
      dayNumber: w.dayNumber,
      name: w.name,
    }));

    // Generate the schedule
    const schedule = generateSchedule(workoutInputs, START_DATE, TRAINING_DAYS);
    expect(schedule).toHaveLength(6);

    // Persist the schedule
    const result = await persistSchedule({
      athleteId,
      programId,
      programAssignmentId: assignment.id,
      schedule,
    });

    expect(result.created).toBe(6);
    expect(result.skipped).toBe(0);
    expect(result.total).toBe(6);

    // Verify the sessions exist in the database
    const sessions = await prisma.workoutSession.findMany({
      where: { athleteId, programAssignmentId: assignment.id },
      orderBy: { date: 'asc' },
    });

    expect(sessions).toHaveLength(6);

    // Verify correct dates for Mon/Tue/Thu/Fri training
    // Week 1: Mon Mar 1, Tue Mar 2, Thu Mar 4 (3 days for week 1)
    // Week 2: Fri Mar 5, Mon Mar 8, Tue Mar 9 (day 1 of week 2 spills to Fri, then next cal week)
    // Wait — 3-day program week with 4 training days means:
    // Week 1 Day 1 → Mon Mar 1
    // Week 1 Day 2 → Tue Mar 2
    // Week 1 Day 3 → Thu Mar 4
    // Week 2 Day 1 → Mon Mar 8
    // Week 2 Day 2 → Tue Mar 9
    // Week 2 Day 3 → Thu Mar 11

    const dateStrings = sessions.map((s) => s.date.toISOString().split('T')[0]);
    expect(dateStrings).toEqual([
      '2027-03-01', // Mon - Week 1 Day 1
      '2027-03-02', // Tue - Week 1 Day 2
      '2027-03-04', // Thu - Week 1 Day 3
      '2027-03-08', // Mon - Week 2 Day 1
      '2027-03-09', // Tue - Week 2 Day 2
      '2027-03-11', // Thu - Week 2 Day 3
    ]);

    // Verify each session has correct metadata
    expect(sessions[0].title).toBe('Week 1 - Heavy Squat');
    expect(sessions[0].weekNumber).toBe(1);
    expect(sessions[0].dayNumber).toBe(1);
    expect(sessions[0].status).toBe('NOT_STARTED');
    expect(sessions[0].programId).toBe(programId);
    expect(sessions[0].workoutId).toBeDefined();

    expect(sessions[3].title).toBe('Week 2 - Volume Squat');
    expect(sessions[3].weekNumber).toBe(2);
    expect(sessions[3].dayNumber).toBe(1);
  });

  // ============================================================
  // Step 3: Re-running scheduling is idempotent (no duplicates)
  // ============================================================

  it('should be idempotent — re-running schedule does not create duplicates', async () => {
    const workouts = await prisma.workout.findMany({
      where: { programId },
      select: { id: true, weekNumber: true, dayNumber: true, name: true },
      orderBy: [{ weekNumber: 'asc' }, { dayNumber: 'asc' }],
    });

    const workoutInputs: WorkoutInput[] = workouts.map((w) => ({
      id: w.id,
      weekNumber: w.weekNumber,
      dayNumber: w.dayNumber,
      name: w.name,
    }));

    const schedule = generateSchedule(workoutInputs, START_DATE, TRAINING_DAYS);
    const result = await persistSchedule({
      athleteId,
      programId,
      programAssignmentId: assignmentId,
      schedule,
    });

    // All 6 should be skipped since they already exist
    expect(result.created).toBe(0);
    expect(result.skipped).toBe(6);

    // Total count in DB should still be 6
    const count = await prisma.workoutSession.count({
      where: { athleteId, programAssignmentId: assignmentId },
    });
    expect(count).toBe(6);
  });

  // ============================================================
  // Step 4: /api/train returns correct workout for a scheduled date
  // ============================================================

  it('should return the correct workout and exercises for a scheduled date', async () => {
    // Query for Mon Mar 1, 2027 — should be "Week 1 - Heavy Squat"
    const targetDate = new Date(2027, 2, 1); // March 1, 2027

    // Replicate /api/train logic: find session by athlete+date
    const session = await prisma.workoutSession.findUnique({
      where: {
        athleteId_date: {
          athleteId,
          date: targetDate,
        },
      },
      include: {
        program: { select: { id: true, name: true } },
      },
    });

    expect(session).not.toBeNull();
    expect(session!.title).toBe('Week 1 - Heavy Squat');
    expect(session!.program!.name).toBe('Integration Test Program');

    // Find the linked workout and its exercises
    const workout = await prisma.workout.findFirst({
      where: {
        programId: session!.programId!,
        name: session!.title!,
      },
      include: {
        exercises: {
          include: {
            exercise: {
              select: { id: true, name: true, category: true, equipment: true },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    expect(workout).not.toBeNull();
    expect(workout!.exercises).toHaveLength(2);

    // Verify exercise details
    const ex1 = workout!.exercises[0];
    expect(ex1.order).toBe(1);
    expect(ex1.prescriptionType).toBe('fixed');
    expect(ex1.prescribedSets).toBe('4');
    expect(ex1.prescribedReps).toBe('5');
    expect(ex1.prescribedLoad).toBe('100');
    expect(ex1.exercise.id).toBe(exerciseIds[0]);

    const ex2 = workout!.exercises[1];
    expect(ex2.order).toBe(2);
    expect(ex2.prescriptionType).toBe('rpe');
    expect(ex2.prescribedSets).toBe('3');
    expect(ex2.prescribedReps).toBe('8');
    expect(ex2.prescribedRPE).toBe(8.0);
    expect(ex2.exercise.id).toBe(exerciseIds[1]);
  });

  // ============================================================
  // Step 5: /api/train returns nextSession when no workout today
  // ============================================================

  it('should return nextSession info when no workout exists for a date', async () => {
    // Wed Mar 3, 2027 is NOT a training day (rest day between Tue and Thu)
    const restDayDate = new Date(2027, 2, 3);

    const session = await prisma.workoutSession.findUnique({
      where: {
        athleteId_date: {
          athleteId,
          date: restDayDate,
        },
      },
    });

    // No session on rest day
    expect(session).toBeNull();

    // Find next upcoming session (should be Thu Mar 4 — Week 1 Day 3)
    const nextSession = await prisma.workoutSession.findFirst({
      where: {
        athleteId,
        date: { gt: restDayDate },
        status: 'NOT_STARTED',
        isSkipped: false,
      },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        title: true,
        program: { select: { name: true } },
      },
    });

    expect(nextSession).not.toBeNull();
    expect(nextSession!.date.toISOString().split('T')[0]).toBe('2027-03-04');
    expect(nextSession!.title).toBe('Week 1 - Heavy Deadlift');
    expect(nextSession!.program!.name).toBe('Integration Test Program');
  });

  // ============================================================
  // Step 6: Verify workout is correctly found for every scheduled date
  // ============================================================

  it('should return the correct workout for each of the 6 scheduled dates', async () => {
    const expectedSchedule = [
      { date: '2027-03-01', title: 'Week 1 - Heavy Squat', week: 1, day: 1 },
      { date: '2027-03-02', title: 'Week 1 - Heavy Bench', week: 1, day: 2 },
      { date: '2027-03-04', title: 'Week 1 - Heavy Deadlift', week: 1, day: 3 },
      { date: '2027-03-08', title: 'Week 2 - Volume Squat', week: 2, day: 1 },
      { date: '2027-03-09', title: 'Week 2 - Volume Bench', week: 2, day: 2 },
      { date: '2027-03-11', title: 'Week 2 - Volume Deadlift', week: 2, day: 3 },
    ];

    for (const expected of expectedSchedule) {
      const [year, month, day] = expected.date.split('-').map(Number);
      const targetDate = new Date(year, month - 1, day);

      const session = await prisma.workoutSession.findUnique({
        where: {
          athleteId_date: {
            athleteId,
            date: targetDate,
          },
        },
      });

      expect(session, `Session for ${expected.date}`).not.toBeNull();
      expect(session!.title).toBe(expected.title);
      expect(session!.weekNumber).toBe(expected.week);
      expect(session!.dayNumber).toBe(expected.day);

      // Verify we can find the workout and its exercises
      const workout = await prisma.workout.findFirst({
        where: {
          programId,
          name: session!.title!,
        },
        include: {
          exercises: { orderBy: { order: 'asc' } },
        },
      });

      expect(workout, `Workout for ${expected.date}`).not.toBeNull();
      expect(workout!.exercises).toHaveLength(2);
    }
  });

  // ============================================================
  // Step 7: Non-scheduled dates return no session
  // ============================================================

  it('should not generate sessions for non-training days in the program range', async () => {
    // Check that no sessions from this assignment exist on non-training days
    // Non-training days in week 1: Wed Mar 3, Fri Mar 5, Sat Mar 6, Sun Mar 7
    const allAssignmentSessions = await prisma.workoutSession.findMany({
      where: { athleteId, programAssignmentId: assignmentId },
      orderBy: { date: 'asc' },
    });

    const sessionDates = new Set(
      allAssignmentSessions.map((s) => s.date.toISOString().split('T')[0])
    );

    // These dates should NOT have sessions from our assignment
    const nonTrainingDates = ['2027-03-03', '2027-03-05', '2027-03-06', '2027-03-07'];
    for (const dateStr of nonTrainingDates) {
      expect(
        sessionDates.has(dateStr),
        `No session expected for ${dateStr}`
      ).toBe(false);
    }

    // Verify only 6 total sessions were created
    expect(allAssignmentSessions).toHaveLength(6);
  });
});
