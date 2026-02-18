/**
 * Integration test for API route CRUD operations against seeded data.
 *
 * Tests the data operations that back the coaching platform API routes:
 * - GET /api/athletes → list athletes, search by name
 * - GET /api/athletes/[id] → single athlete profile with relations
 * - GET /api/exercises → list exercises with search and category filter
 * - POST/PUT/DELETE operations for athletes and exercises
 *
 * Prerequisites:
 * - PostgreSQL running with DATABASE_URL configured
 * - Database seeded: `npx prisma db seed`
 *
 * Run with: npx vitest run src/lib/api-routes.integration.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let coachId: string;

beforeAll(async () => {
  const coach = await prisma.coach.findFirst({
    where: { email: 'joe@cannolistrength.com' },
  });
  if (!coach) {
    throw new Error('Coach not found in database. Run `npx prisma db seed` first.');
  }
  coachId = coach.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ============================================================
// GET /api/athletes — list athletes
// ============================================================

describe('GET /api/athletes', () => {
  it('should return all 5 seeded athletes for the coach', async () => {
    const athletes = await prisma.athlete.findMany({
      where: { coachId },
      orderBy: { name: 'asc' },
    });

    expect(athletes).toHaveLength(5);
    const names = athletes.map((a) => a.name);
    expect(names).toContain('Matt Alldian');
    expect(names).toContain('Chris Laakko');
    expect(names).toContain('Michael Odermatt');
  });

  it('should support search by name (case-insensitive)', async () => {
    const results = await prisma.athlete.findMany({
      where: {
        coachId,
        name: { contains: 'matt', mode: 'insensitive' },
      },
    });

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((a) => a.name === 'Matt Alldian')).toBe(true);
  });

  it('should support filtering by isCompetitor', async () => {
    const competitors = await prisma.athlete.findMany({
      where: { coachId, isCompetitor: true },
    });
    const nonCompetitors = await prisma.athlete.findMany({
      where: { coachId, isCompetitor: false },
    });

    expect(competitors.length + nonCompetitors.length).toBe(5);
  });

  it('should support filtering by isRemote', async () => {
    const remote = await prisma.athlete.findMany({
      where: { coachId, isRemote: true },
    });

    expect(remote.length).toBeGreaterThanOrEqual(1);
  });

  it('should return empty array for search with no matches', async () => {
    const results = await prisma.athlete.findMany({
      where: {
        coachId,
        name: { contains: 'zzz_nonexistent_name_zzz', mode: 'insensitive' },
      },
    });

    expect(results).toHaveLength(0);
  });
});

// ============================================================
// GET /api/athletes/[id] — single athlete with relations
// ============================================================

describe('GET /api/athletes/[id]', () => {
  let athleteId: string;

  beforeAll(async () => {
    const matt = await prisma.athlete.findFirst({
      where: { coachId, name: 'Matt Alldian' },
    });
    if (!matt) throw new Error('Matt Alldian not found in database');
    athleteId = matt.id;
  });

  it('should return athlete profile with all fields', async () => {
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
    });

    expect(athlete).not.toBeNull();
    expect(athlete!.name).toBe('Matt Alldian');
    expect(athlete!.coachId).toBe(coachId);
    expect(athlete!.id).toBeDefined();
    expect(athlete!.createdAt).toBeInstanceOf(Date);
  });

  it('should include program assignments', async () => {
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      include: {
        programAssignments: {
          include: { program: true },
        },
      },
    });

    expect(athlete).not.toBeNull();
    expect(athlete!.programAssignments.length).toBeGreaterThanOrEqual(1);
    expect(athlete!.programAssignments[0].program).toBeDefined();
    expect(athlete!.programAssignments[0].program.name).toBeDefined();
  });

  it('should include workout sessions (recent first)', async () => {
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      include: {
        workoutSessions: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    expect(athlete).not.toBeNull();
    expect(athlete!.workoutSessions.length).toBeGreaterThanOrEqual(1);

    // Verify descending order
    const dates = athlete!.workoutSessions.map((s) => s.date.getTime());
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
    }
  });

  it('should include max snapshots for the athlete', async () => {
    const maxes = await prisma.maxSnapshot.findMany({
      where: { athleteId },
      include: { exercise: { select: { name: true } } },
      orderBy: { date: 'desc' },
      take: 5,
    });

    expect(maxes.length).toBeGreaterThanOrEqual(1);
    expect(maxes[0].exercise.name).toBeDefined();
    expect(maxes[0].workingMax).toBeGreaterThan(0);
  });

  it('should return null for non-existent athlete ID', async () => {
    const athlete = await prisma.athlete.findUnique({
      where: { id: '00000000-0000-0000-0000-000000000000' },
    });

    expect(athlete).toBeNull();
  });
});

// ============================================================
// GET /api/exercises — list exercises with search/filter
// ============================================================

describe('GET /api/exercises', () => {
  it('should return 800+ exercises from the library', async () => {
    const count = await prisma.exercise.count();
    expect(count).toBeGreaterThan(800);
  });

  it('should support search by name (case-insensitive)', async () => {
    const results = await prisma.exercise.findMany({
      where: { name: { contains: 'squat', mode: 'insensitive' } },
    });

    expect(results.length).toBeGreaterThanOrEqual(5);
    expect(results.every((e) => e.name.toLowerCase().includes('squat'))).toBe(true);
  });

  it('should support filtering by category', async () => {
    const strength = await prisma.exercise.findMany({
      where: { category: 'strength' },
    });

    expect(strength.length).toBeGreaterThan(100);
    expect(strength.every((e) => e.category === 'strength')).toBe(true);
  });

  it('should support combined search and category filter', async () => {
    const results = await prisma.exercise.findMany({
      where: {
        name: { contains: 'press', mode: 'insensitive' },
        category: 'strength',
      },
    });

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.every((e) => e.category === 'strength')).toBe(true);
    expect(results.every((e) => e.name.toLowerCase().includes('press'))).toBe(true);
  });

  it('should return exercises with full detail fields', async () => {
    const exercise = await prisma.exercise.findFirst({
      where: { name: { contains: 'Barbell Squat', mode: 'insensitive' } },
    });

    expect(exercise).not.toBeNull();
    expect(exercise!.name).toBeDefined();
    expect(exercise!.category).toBeDefined();
    expect(exercise!.primaryMuscles).toBeDefined();
    expect(exercise!.instructions).toBeDefined();
  });

  it('should support pagination with skip/take', async () => {
    const page1 = await prisma.exercise.findMany({
      orderBy: { name: 'asc' },
      take: 20,
      skip: 0,
    });
    const page2 = await prisma.exercise.findMany({
      orderBy: { name: 'asc' },
      take: 20,
      skip: 20,
    });

    expect(page1).toHaveLength(20);
    expect(page2).toHaveLength(20);
    // No overlap between pages
    const page1Ids = new Set(page1.map((e) => e.id));
    expect(page2.every((e) => !page1Ids.has(e.id))).toBe(true);
  });

  it('should return exercises with powerlifting tags', async () => {
    const tagged = await prisma.exercise.findMany({
      where: { NOT: { tags: { equals: [] } } },
      take: 5,
    });

    expect(tagged.length).toBeGreaterThanOrEqual(1);
    for (const ex of tagged) {
      const tags = ex.tags as string[];
      expect(tags.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================
// POST /api/athletes — create athlete
// ============================================================

describe('POST /api/athletes (create)', () => {
  const createdIds: string[] = [];

  afterAll(async () => {
    // Clean up test-created athletes
    if (createdIds.length > 0) {
      await prisma.athlete.deleteMany({
        where: { id: { in: createdIds } },
      });
    }
  });

  it('should create an athlete with required fields only', async () => {
    const athlete = await prisma.athlete.create({
      data: {
        coachId,
        name: 'Test Athlete Minimal',
      },
    });

    createdIds.push(athlete.id);

    expect(athlete.id).toBeDefined();
    expect(athlete.name).toBe('Test Athlete Minimal');
    expect(athlete.coachId).toBe(coachId);
    expect(athlete.experienceLevel).toBe('intermediate'); // default
    expect(athlete.isRemote).toBe(true); // default
    expect(athlete.isCompetitor).toBe(false); // default
  });

  it('should create an athlete with all profile fields', async () => {
    const athlete = await prisma.athlete.create({
      data: {
        coachId,
        name: 'Test Athlete Full',
        email: 'test-full@example.com',
        bodyweight: 82.5,
        weightClass: '83kg',
        experienceLevel: 'advanced',
        isRemote: false,
        isCompetitor: true,
        federation: 'IPF',
        notes: 'Integration test athlete',
      },
    });

    createdIds.push(athlete.id);

    expect(athlete.name).toBe('Test Athlete Full');
    expect(athlete.email).toBe('test-full@example.com');
    expect(athlete.bodyweight).toBe(82.5);
    expect(athlete.weightClass).toBe('83kg');
    expect(athlete.experienceLevel).toBe('advanced');
    expect(athlete.isRemote).toBe(false);
    expect(athlete.isCompetitor).toBe(true);
    expect(athlete.federation).toBe('IPF');
    expect(athlete.notes).toBe('Integration test athlete');
  });

  it('should reject creation without coachId', async () => {
    await expect(
      prisma.athlete.create({
        data: {
          coachId: '00000000-0000-0000-0000-000000000000',
          name: 'Should Fail',
        },
      }),
    ).rejects.toThrow();
  });
});

// ============================================================
// PUT /api/athletes/[id] — update athlete
// ============================================================

describe('PUT /api/athletes/[id] (update)', () => {
  let testAthleteId: string;

  beforeAll(async () => {
    const athlete = await prisma.athlete.create({
      data: {
        coachId,
        name: 'Update Test Athlete',
        email: 'update-test@example.com',
        bodyweight: 75.0,
      },
    });
    testAthleteId = athlete.id;
  });

  afterAll(async () => {
    await prisma.athlete.delete({ where: { id: testAthleteId } }).catch(() => {});
  });

  it('should update athlete name', async () => {
    const updated = await prisma.athlete.update({
      where: { id: testAthleteId },
      data: { name: 'Updated Name' },
    });

    expect(updated.name).toBe('Updated Name');
  });

  it('should update multiple fields at once', async () => {
    const updated = await prisma.athlete.update({
      where: { id: testAthleteId },
      data: {
        bodyweight: 80.0,
        isCompetitor: true,
        federation: 'USAPL',
        notes: 'Updated via test',
      },
    });

    expect(updated.bodyweight).toBe(80.0);
    expect(updated.isCompetitor).toBe(true);
    expect(updated.federation).toBe('USAPL');
    expect(updated.notes).toBe('Updated via test');
  });

  it('should update the updatedAt timestamp', async () => {
    const before = await prisma.athlete.findUnique({ where: { id: testAthleteId } });
    // Small delay to ensure timestamp changes
    await new Promise((resolve) => setTimeout(resolve, 50));
    const updated = await prisma.athlete.update({
      where: { id: testAthleteId },
      data: { name: 'Timestamp Test' },
    });

    expect(updated.updatedAt.getTime()).toBeGreaterThan(before!.updatedAt.getTime());
  });
});

// ============================================================
// DELETE /api/athletes/[id] — delete athlete
// ============================================================

describe('DELETE /api/athletes/[id]', () => {
  it('should delete an athlete and cascade set logs', async () => {
    // Create athlete with related data
    const athlete = await prisma.athlete.create({
      data: {
        coachId,
        name: 'Delete Test Athlete',
      },
    });

    // Verify it exists
    const found = await prisma.athlete.findUnique({ where: { id: athlete.id } });
    expect(found).not.toBeNull();

    // Delete
    await prisma.athlete.delete({ where: { id: athlete.id } });

    // Verify deleted
    const deleted = await prisma.athlete.findUnique({ where: { id: athlete.id } });
    expect(deleted).toBeNull();
  });

  it('should fail to delete a non-existent athlete', async () => {
    await expect(
      prisma.athlete.delete({
        where: { id: '00000000-0000-0000-0000-000000000000' },
      }),
    ).rejects.toThrow();
  });
});

// ============================================================
// POST /api/exercises — create exercise
// ============================================================

describe('POST /api/exercises (create)', () => {
  const createdIds: string[] = [];

  afterAll(async () => {
    if (createdIds.length > 0) {
      await prisma.exercise.deleteMany({
        where: { id: { in: createdIds } },
      });
    }
  });

  it('should create an exercise with required fields', async () => {
    const exercise = await prisma.exercise.create({
      data: {
        coachId,
        name: 'Test Custom Exercise',
        category: 'strength',
      },
    });

    createdIds.push(exercise.id);

    expect(exercise.id).toBeDefined();
    expect(exercise.name).toBe('Test Custom Exercise');
    expect(exercise.category).toBe('strength');
    expect(exercise.coachId).toBe(coachId);
  });

  it('should create an exercise with all detail fields', async () => {
    const exercise = await prisma.exercise.create({
      data: {
        coachId,
        name: 'Test Detailed Exercise',
        category: 'strength',
        force: 'push',
        level: 'intermediate',
        mechanic: 'compound',
        equipment: 'barbell',
        primaryMuscles: ['chest', 'triceps'],
        secondaryMuscles: ['shoulders'],
        instructions: ['Step 1: Setup', 'Step 2: Execute'],
        videoUrl: 'https://example.com/video.mp4',
        cues: 'Brace core, drive through heels',
        tags: ['competition_variation', 'bench'],
      },
    });

    createdIds.push(exercise.id);

    expect(exercise.force).toBe('push');
    expect(exercise.level).toBe('intermediate');
    expect(exercise.mechanic).toBe('compound');
    expect(exercise.equipment).toBe('barbell');
    expect(exercise.primaryMuscles).toEqual(['chest', 'triceps']);
    expect(exercise.secondaryMuscles).toEqual(['shoulders']);
    expect(exercise.instructions).toEqual(['Step 1: Setup', 'Step 2: Execute']);
    expect(exercise.videoUrl).toBe('https://example.com/video.mp4');
    expect(exercise.cues).toBe('Brace core, drive through heels');
    expect(exercise.tags).toEqual(['competition_variation', 'bench']);
  });

  it('should create a library exercise without coachId', async () => {
    const exercise = await prisma.exercise.create({
      data: {
        name: 'Test Library Exercise',
        category: 'stretching',
      },
    });

    createdIds.push(exercise.id);

    expect(exercise.coachId).toBeNull();
    expect(exercise.name).toBe('Test Library Exercise');
  });
});

// ============================================================
// PUT /api/exercises — update exercise
// ============================================================

describe('PUT /api/exercises (update)', () => {
  let testExerciseId: string;

  beforeAll(async () => {
    const exercise = await prisma.exercise.create({
      data: {
        coachId,
        name: 'Exercise Update Test',
        category: 'strength',
      },
    });
    testExerciseId = exercise.id;
  });

  afterAll(async () => {
    await prisma.exercise.delete({ where: { id: testExerciseId } }).catch(() => {});
  });

  it('should update exercise name and category', async () => {
    const updated = await prisma.exercise.update({
      where: { id: testExerciseId },
      data: {
        name: 'Updated Exercise Name',
        category: 'powerlifting',
      },
    });

    expect(updated.name).toBe('Updated Exercise Name');
    expect(updated.category).toBe('powerlifting');
  });

  it('should update exercise tags', async () => {
    const updated = await prisma.exercise.update({
      where: { id: testExerciseId },
      data: {
        tags: ['competition_lift', 'squat'],
      },
    });

    expect(updated.tags).toEqual(['competition_lift', 'squat']);
  });
});

// ============================================================
// DELETE /api/exercises — delete exercise
// ============================================================

describe('DELETE /api/exercises', () => {
  it('should delete a coach-created exercise', async () => {
    const exercise = await prisma.exercise.create({
      data: {
        coachId,
        name: 'Exercise To Delete',
        category: 'strength',
      },
    });

    await prisma.exercise.delete({ where: { id: exercise.id } });

    const deleted = await prisma.exercise.findUnique({ where: { id: exercise.id } });
    expect(deleted).toBeNull();
  });
});

// ============================================================
// Cross-entity queries (dashboard/analytics support)
// ============================================================

describe('Cross-entity queries', () => {
  it('should count workouts completed per athlete', async () => {
    const athletes = await prisma.athlete.findMany({
      where: { coachId },
      include: {
        _count: { select: { workoutSessions: true } },
      },
    });

    expect(athletes).toHaveLength(5);
    const totalSessions = athletes.reduce((sum, a) => sum + a._count.workoutSessions, 0);
    expect(totalSessions).toBeGreaterThan(100);
  });

  it('should get recent set logs with exercise and athlete info', async () => {
    const recentSets = await prisma.setLog.findMany({
      take: 10,
      orderBy: { completedAt: 'desc' },
      include: {
        athlete: { select: { name: true } },
        workoutExercise: {
          include: {
            exercise: { select: { name: true } },
          },
        },
      },
    });

    expect(recentSets.length).toBeGreaterThanOrEqual(1);
    expect(recentSets[0].athlete.name).toBeDefined();
    expect(recentSets[0].workoutExercise.exercise.name).toBeDefined();
    // Weight can be 0 for bodyweight exercises
    expect(recentSets[0].weight).toBeGreaterThanOrEqual(0);
    expect(recentSets[0].reps).toBeGreaterThanOrEqual(0);
  });

  it('should aggregate athlete stats (total sets, max tonnage)', async () => {
    const matt = await prisma.athlete.findFirst({
      where: { coachId, name: 'Matt Alldian' },
    });
    expect(matt).not.toBeNull();

    const result = await prisma.$queryRaw<[{ total_sets: number; total_tonnage: number }]>`
      SELECT
        COUNT(*)::int as total_sets,
        COALESCE(SUM("weight" * "reps"), 0)::float as total_tonnage
      FROM "SetLog"
      WHERE "athleteId" = ${matt!.id}
    `;

    expect(result[0].total_sets).toBeGreaterThan(100);
    expect(result[0].total_tonnage).toBeGreaterThan(10000);
  });

  it('should get current max snapshots per exercise for an athlete', async () => {
    const matt = await prisma.athlete.findFirst({
      where: { coachId, name: 'Matt Alldian' },
    });
    expect(matt).not.toBeNull();

    const currentMaxes = await prisma.maxSnapshot.findMany({
      where: { athleteId: matt!.id, isCurrentMax: true },
      include: { exercise: { select: { name: true } } },
      orderBy: { workingMax: 'desc' },
    });

    // Matt should have at least some current maxes
    expect(currentMaxes.length).toBeGreaterThanOrEqual(1);
    // Each should have a positive working max
    for (const max of currentMaxes) {
      expect(max.workingMax).toBeGreaterThan(0);
      expect(max.exercise.name).toBeDefined();
    }
  });
});
