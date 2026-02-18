/**
 * Integration test for seed script — verifies import counts match source data.
 *
 * This test runs against the live development database (seeded via `npx prisma db seed`).
 * It compares transformer-computed expected counts against actual database records.
 *
 * Prerequisites:
 * - PostgreSQL running with DATABASE_URL configured
 * - Database seeded: `npx prisma db seed`
 *
 * Run with: npx vitest run src/lib/teambuildr/seed-import.integration.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { TeamBuildrExport } from './types';
import {
  transformTeamBuildrExport,
  deduplicateMaxSnapshots,
} from './transformer';

const prisma = new PrismaClient();

// Transformer output — computed once from source JSON
let expectedSessions: number;
let expectedWorkoutExercises: number;
let expectedSets: number;
let expectedMaxSnapshots: number;
let expectedAthleteCount: number;
let coachId: string;

// Per-athlete expected data from transformer
let sessionsByAthlete: Map<number, number>;
let exercisesByAthlete: Map<number, number>;
let setsByAthlete: Map<number, number>;
let maxesByAthlete: Map<number, number>;

// Lookup: TB athlete ID -> DB athlete ID
let tbIdToDbId: Map<number, string>;

beforeAll(async () => {
  // Load and transform source data
  const exportPath = join(
    __dirname,
    '..',
    '..',
    '..',
    'test-data',
    'teambuildr-full-export-5-athletes.json',
  );

  if (!existsSync(exportPath)) {
    throw new Error(
      'TeamBuildr export not found. Place test-data/teambuildr-full-export-5-athletes.json first.',
    );
  }

  const raw = readFileSync(exportPath, 'utf-8');
  const data = JSON.parse(raw) as TeamBuildrExport;

  const transformed = transformTeamBuildrExport(data);
  const { sessions, workoutExercises, maxSnapshots } = transformed;
  const dedupedMaxes = deduplicateMaxSnapshots(maxSnapshots);

  expectedAthleteCount = Object.keys(data.athletes).length;
  expectedSessions = sessions.length;
  expectedWorkoutExercises = workoutExercises.length;
  expectedSets = workoutExercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  expectedMaxSnapshots = dedupedMaxes.length;

  // Build per-athlete expected counts
  sessionsByAthlete = new Map();
  exercisesByAthlete = new Map();
  setsByAthlete = new Map();
  maxesByAthlete = new Map();

  for (const session of sessions) {
    sessionsByAthlete.set(
      session.athleteTbId,
      (sessionsByAthlete.get(session.athleteTbId) ?? 0) + 1,
    );
  }
  for (const ex of workoutExercises) {
    exercisesByAthlete.set(
      ex.athleteTbId,
      (exercisesByAthlete.get(ex.athleteTbId) ?? 0) + 1,
    );
    setsByAthlete.set(
      ex.athleteTbId,
      (setsByAthlete.get(ex.athleteTbId) ?? 0) + ex.sets.length,
    );
  }
  for (const max of dedupedMaxes) {
    maxesByAthlete.set(
      max.athleteTbId,
      (maxesByAthlete.get(max.athleteTbId) ?? 0) + 1,
    );
  }

  // Resolve coach and athlete DB IDs
  const coach = await prisma.coach.findFirst({
    where: { email: 'joe@cannolistrength.com' },
  });
  if (!coach) {
    throw new Error('Coach not found in database. Run `npx prisma db seed` first.');
  }
  coachId = coach.id;

  const dbAthletes = await prisma.athlete.findMany({
    where: { coachId: coach.id },
    select: { id: true, name: true, metadata: true },
  });

  tbIdToDbId = new Map();
  for (const athlete of dbAthletes) {
    const meta = athlete.metadata as { teambuildrId?: number } | null;
    if (meta?.teambuildrId) {
      tbIdToDbId.set(meta.teambuildrId, athlete.id);
    }
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ============================================================
// Aggregate count checks
// ============================================================

describe('Aggregate import counts', () => {
  it('should have 5 athletes', async () => {
    const count = await prisma.athlete.count({ where: { coachId } });
    expect(count).toBe(expectedAthleteCount);
    expect(count).toBe(5);
  });

  it('should have the expected number of WorkoutSessions', async () => {
    const count = await prisma.workoutSession.count();
    expect(count).toBe(expectedSessions);
  });

  it('should have the expected number of WorkoutExercises', async () => {
    const count = await prisma.workoutExercise.count();
    expect(count).toBe(expectedWorkoutExercises);
  });

  it('should have the expected number of SetLogs', async () => {
    const count = await prisma.setLog.count();
    expect(count).toBe(expectedSets);
  });

  it('should have the expected number of MaxSnapshots (deduplicated)', async () => {
    const count = await prisma.maxSnapshot.count();
    expect(count).toBe(expectedMaxSnapshots);
  });

  it('should have 900+ exercises in the library', async () => {
    const count = await prisma.exercise.count();
    expect(count).toBeGreaterThanOrEqual(900);
  });

  it('should have coach Joe Cristando', async () => {
    const coach = await prisma.coach.findFirst({
      where: { email: 'joe@cannolistrength.com' },
    });
    expect(coach).not.toBeNull();
    expect(coach!.name).toBe('Joe Cristando');
    expect(coach!.brandName).toBe('Cannoli Strength');
  });
});

// ============================================================
// Per-athlete count checks
// ============================================================

describe('Per-athlete counts', () => {
  it('should match transformer session counts for each athlete', async () => {
    for (const [tbId, expected] of sessionsByAthlete) {
      const dbId = tbIdToDbId.get(tbId);
      expect(dbId, `No DB ID for TB athlete ${tbId}`).toBeDefined();

      const actual = await prisma.workoutSession.count({
        where: { athleteId: dbId! },
      });
      expect(actual, `Sessions for TB#${tbId}`).toBe(expected);
    }
  });

  it('should match transformer WorkoutExercise counts for each athlete', async () => {
    for (const [tbId, expected] of exercisesByAthlete) {
      const dbId = tbIdToDbId.get(tbId);
      expect(dbId, `No DB ID for TB athlete ${tbId}`).toBeDefined();

      // Get programs for this athlete (via WorkoutSession)
      const sessions = await prisma.workoutSession.findMany({
        where: { athleteId: dbId! },
        select: { programId: true },
      });
      const programIds = [...new Set(sessions.map((s) => s.programId).filter(Boolean))];

      const actual = await prisma.workoutExercise.count({
        where: { workout: { programId: { in: programIds as string[] } } },
      });
      expect(actual, `WorkoutExercises for TB#${tbId}`).toBe(expected);
    }
  });

  it('should match transformer SetLog counts for each athlete', async () => {
    for (const [tbId, expected] of setsByAthlete) {
      const dbId = tbIdToDbId.get(tbId);
      expect(dbId, `No DB ID for TB athlete ${tbId}`).toBeDefined();

      const actual = await prisma.setLog.count({
        where: { athleteId: dbId! },
      });
      expect(actual, `SetLogs for TB#${tbId}`).toBe(expected);
    }
  });

  it('should match transformer MaxSnapshot counts for each athlete', async () => {
    for (const [tbId, expected] of maxesByAthlete) {
      const dbId = tbIdToDbId.get(tbId);
      expect(dbId, `No DB ID for TB athlete ${tbId}`).toBeDefined();

      const actual = await prisma.maxSnapshot.count({
        where: { athleteId: dbId! },
      });
      expect(actual, `MaxSnapshots for TB#${tbId}`).toBe(expected);
    }
  });
});

// ============================================================
// Per-athlete tonnage checks (DB computed vs source summaries)
// ============================================================

describe('Per-athlete tonnage (DB >= TeamBuildr summary)', () => {
  it('should have DB tonnage >= TeamBuildr summary tonnage for each athlete', async () => {
    const exportPath = join(
      __dirname,
      '..',
      '..',
      '..',
      'test-data',
      'teambuildr-full-export-5-athletes.json',
    );
    const raw = readFileSync(exportPath, 'utf-8');
    const data = JSON.parse(raw) as TeamBuildrExport;

    for (const [, athleteData] of Object.entries(data.athletes)) {
      const tbId = athleteData.profile.id;
      const dbId = tbIdToDbId.get(tbId);
      if (!dbId) continue;

      // Source tonnage from TeamBuildr summaries
      let sourceTonnage = 0;
      for (const [, summary] of Object.entries(athleteData.summaries || {})) {
        sourceTonnage += summary.tonnage || 0;
      }

      // DB tonnage from SetLogs
      const result = await prisma.$queryRaw<[{ tonnage: number }]>`
        SELECT COALESCE(SUM("weight" * "reps"), 0)::float as tonnage
        FROM "SetLog"
        WHERE "athleteId" = ${dbId}
      `;
      const dbTonnage = Math.round(result[0].tonnage);

      // DB should have >= tonnage (we store all sets, TB summary only counts "completed")
      expect(
        dbTonnage,
        `Tonnage for TB#${tbId}: DB=${dbTonnage}, source=${Math.round(sourceTonnage)}`,
      ).toBeGreaterThanOrEqual(Math.round(sourceTonnage));
    }
  });
});

// ============================================================
// Data integrity checks
// ============================================================

describe('Data integrity', () => {
  it('should have no orphaned SetLogs (missing WorkoutExercise)', async () => {
    const result = await prisma.$queryRaw<[{ count: number }]>`
      SELECT COUNT(*)::int as count FROM "SetLog" sl
      WHERE NOT EXISTS (
        SELECT 1 FROM "WorkoutExercise" we WHERE we.id = sl."workoutExerciseId"
      )
    `;
    expect(result[0].count).toBe(0);
  });

  it('should have no orphaned MaxSnapshots (missing Exercise)', async () => {
    const result = await prisma.$queryRaw<[{ count: number }]>`
      SELECT COUNT(*)::int as count FROM "MaxSnapshot" ms
      WHERE NOT EXISTS (
        SELECT 1 FROM "Exercise" e WHERE e.id = ms."exerciseId"
      )
    `;
    expect(result[0].count).toBe(0);
  });

  it('should have no empty SetLogs (0 weight AND 0 reps)', async () => {
    const count = await prisma.setLog.count({
      where: { weight: 0, reps: 0 },
    });
    expect(count).toBe(0);
  });

  it('should have no duplicate sessions (same athleteId + date)', async () => {
    const result = await prisma.$queryRaw<[{ count: number }]>`
      SELECT COUNT(*)::int as count FROM (
        SELECT "athleteId", "date", COUNT(*) as cnt
        FROM "WorkoutSession"
        GROUP BY "athleteId", "date"
        HAVING COUNT(*) > 1
      ) dupes
    `;
    expect(result[0].count).toBe(0);
  });

  it('should have all SetLogs using kg unit', async () => {
    const nonKg = await prisma.setLog.count({
      where: { NOT: { unit: 'kg' } },
    });
    expect(nonKg).toBe(0);
  });

  it('should have exercises with powerlifting tags', async () => {
    const tagged = await prisma.exercise.count({
      where: { NOT: { tags: { equals: [] } } },
    });
    expect(tagged).toBeGreaterThan(100);
  });
});
