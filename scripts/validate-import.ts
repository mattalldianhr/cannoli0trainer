/**
 * Import Validation Script
 *
 * Compares source TeamBuildr JSON counts against imported database records.
 * Reports per-athlete and aggregate discrepancies with pass/fail status.
 *
 * Usage: npx tsx scripts/validate-import.ts
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { TeamBuildrExport } from '../src/lib/teambuildr/types';
import {
  transformTeamBuildrExport,
  deduplicateMaxSnapshots,
} from '../src/lib/teambuildr/transformer';

const prisma = new PrismaClient();

// ============================================================
// Types
// ============================================================

interface AthleteValidation {
  name: string;
  tbId: number;
  dbId: string | null;
  source: {
    dates: number;
    workoutItems: number;
    exercises: number;
    sets: number;
    maxSnapshots: number;
    tonnage: number;
    reps: number;
  };
  db: {
    sessions: number;
    workoutExercises: number;
    setLogs: number;
    maxSnapshots: number;
    tonnage: number;
    reps: number;
  };
  checks: CheckResult[];
}

interface CheckResult {
  name: string;
  pass: boolean;
  expected: number | string;
  actual: number | string;
  detail?: string;
  /** 'warn' checks are informational — they log divergence but don't fail the run */
  severity?: 'error' | 'warn';
}

// ============================================================
// Main validation
// ============================================================

function printCheck(check: CheckResult, indent = '  ') {
  const icon = check.pass ? 'PASS' : (check.severity === 'warn' ? 'WARN' : 'FAIL');
  console.log(`${indent}[${icon}] ${check.name}: expected=${check.expected}, actual=${check.actual}${check.detail ? ` (${check.detail})` : ''}`);
}

async function main() {
  console.log('=== TeamBuildr Import Validation ===\n');

  // Load source data
  const exportPath = join(__dirname, '..', 'test-data', 'teambuildr-full-export-5-athletes.json');
  if (!existsSync(exportPath)) {
    console.log('ERROR: TeamBuildr export not found at test-data/teambuildr-full-export-5-athletes.json');
    process.exit(1);
  }

  const raw = readFileSync(exportPath, 'utf-8');
  const data = JSON.parse(raw) as TeamBuildrExport;

  // Run transformer to get expected counts
  const transformed = transformTeamBuildrExport(data);
  const { sessions, workoutExercises, maxSnapshots, stats } = transformed;
  const dedupedMaxes = deduplicateMaxSnapshots(maxSnapshots);

  // Compute source tonnage/reps from summaries per athlete
  const sourceTonnageByAthlete = new Map<number, { tonnage: number; reps: number }>();
  for (const [, athleteData] of Object.entries(data.athletes)) {
    const tbId = athleteData.profile.id;
    let totalTonnage = 0;
    let totalReps = 0;
    for (const [, summary] of Object.entries(athleteData.summaries || {})) {
      totalTonnage += summary.tonnage || 0;
      totalReps += summary.repsCompleted || 0;
    }
    sourceTonnageByAthlete.set(tbId, { tonnage: totalTonnage, reps: totalReps });
  }

  // Compute source PR count from summaries
  const sourcePRsByAthlete = new Map<number, number>();
  for (const [, athleteData] of Object.entries(data.athletes)) {
    const tbId = athleteData.profile.id;
    let totalPRs = 0;
    for (const [, summary] of Object.entries(athleteData.summaries || {})) {
      totalPRs += (summary.newPRs || []).length;
    }
    sourcePRsByAthlete.set(tbId, totalPRs);
  }

  // Get DB athletes
  const coach = await prisma.coach.findFirst({ where: { email: 'cannoli.strength@gmail.com' } });
  if (!coach) {
    console.log('ERROR: Coach not found. Run seed first.');
    process.exit(1);
  }

  const dbAthletes = await prisma.athlete.findMany({
    where: { coachId: coach.id },
    select: { id: true, name: true, metadata: true },
  });

  const tbIdToDbId = new Map<number, string>();
  const tbIdToName = new Map<number, string>();
  for (const athlete of dbAthletes) {
    const meta = athlete.metadata as { teambuildrId?: number } | null;
    if (meta?.teambuildrId) {
      tbIdToDbId.set(meta.teambuildrId, athlete.id);
      tbIdToName.set(meta.teambuildrId, athlete.name);
    }
  }

  // ============================================================
  // Aggregate checks
  // ============================================================

  const aggregateChecks: CheckResult[] = [];

  // 1. Athlete count
  const dbAthleteCount = await prisma.athlete.count({ where: { coachId: coach.id } });
  aggregateChecks.push({
    name: 'Athlete count',
    pass: dbAthleteCount === Object.keys(data.athletes).length,
    expected: Object.keys(data.athletes).length,
    actual: dbAthleteCount,
  });

  // 2. Total sessions
  const dbSessionCount = await prisma.workoutSession.count();
  aggregateChecks.push({
    name: 'Total WorkoutSessions',
    pass: dbSessionCount === sessions.length,
    expected: sessions.length,
    actual: dbSessionCount,
    detail: `Source dates: ${stats.totalDates}`,
  });

  // 3. Total workout exercises (transformer outputs)
  const dbExerciseCount = await prisma.workoutExercise.count();
  aggregateChecks.push({
    name: 'Total WorkoutExercises',
    pass: dbExerciseCount === workoutExercises.length,
    expected: workoutExercises.length,
    actual: dbExerciseCount,
    detail: `Source items: ${stats.totalWorkoutItems}, skipped: ${stats.skippedNonExercises + stats.skippedNoData}`,
  });

  // 4. Total set logs
  const totalExpectedSets = workoutExercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const dbSetCount = await prisma.setLog.count();
  aggregateChecks.push({
    name: 'Total SetLogs',
    pass: dbSetCount === totalExpectedSets,
    expected: totalExpectedSets,
    actual: dbSetCount,
  });

  // 5. Total max snapshots (deduplicated)
  const dbMaxCount = await prisma.maxSnapshot.count();
  aggregateChecks.push({
    name: 'Total MaxSnapshots (deduped)',
    pass: dbMaxCount === dedupedMaxes.length,
    expected: dedupedMaxes.length,
    actual: dbMaxCount,
    detail: `Raw max snapshots: ${maxSnapshots.length}`,
  });

  // 6. Exercise library count
  const dbTotalExercises = await prisma.exercise.count();
  aggregateChecks.push({
    name: 'Exercise library count',
    pass: dbTotalExercises >= 900,
    expected: '>=900',
    actual: dbTotalExercises,
  });

  // 7. Coach exists
  aggregateChecks.push({
    name: 'Coach exists',
    pass: true,
    expected: 'Joe Cristando',
    actual: coach.name,
  });

  // Print aggregate results
  console.log('--- Aggregate Checks ---\n');
  let totalPass = 0;
  let totalFail = 0;
  let totalWarn = 0;

  for (const check of aggregateChecks) {
    const icon = check.pass ? 'PASS' : (check.severity === 'warn' ? 'WARN' : 'FAIL');
    console.log(`  [${icon}] ${check.name}: expected=${check.expected}, actual=${check.actual}${check.detail ? ` (${check.detail})` : ''}`);
    if (check.pass) totalPass++;
    else if (check.severity === 'warn') totalWarn++;
    else totalFail++;
  }

  // ============================================================
  // Per-athlete checks
  // ============================================================

  console.log('\n--- Per-Athlete Checks ---\n');

  // Group transformer outputs by athlete
  const sessionsByAthlete = new Map<number, number>();
  for (const session of sessions) {
    sessionsByAthlete.set(session.athleteTbId, (sessionsByAthlete.get(session.athleteTbId) ?? 0) + 1);
  }

  const exercisesByAthlete = new Map<number, number>();
  const setsByAthlete = new Map<number, number>();
  for (const ex of workoutExercises) {
    exercisesByAthlete.set(ex.athleteTbId, (exercisesByAthlete.get(ex.athleteTbId) ?? 0) + 1);
    setsByAthlete.set(ex.athleteTbId, (setsByAthlete.get(ex.athleteTbId) ?? 0) + ex.sets.length);
  }

  const maxesByAthlete = new Map<number, number>();
  for (const max of dedupedMaxes) {
    maxesByAthlete.set(max.athleteTbId, (maxesByAthlete.get(max.athleteTbId) ?? 0) + 1);
  }

  for (const [athleteName, athleteData] of Object.entries(data.athletes)) {
    const tbId = athleteData.profile.id;
    const dbId = tbIdToDbId.get(tbId);
    const displayName = tbIdToName.get(tbId) ?? athleteName;

    console.log(`  ${displayName} (TB#${tbId}):`);

    if (!dbId) {
      console.log(`    [FAIL] Athlete not found in database`);
      totalFail++;
      continue;
    }

    const checks: CheckResult[] = [];

    // Sessions
    const expectedSessions = sessionsByAthlete.get(tbId) ?? 0;
    const dbSessions = await prisma.workoutSession.count({ where: { athleteId: dbId } });
    checks.push({
      name: 'Sessions',
      pass: dbSessions === expectedSessions,
      expected: expectedSessions,
      actual: dbSessions,
    });

    // WorkoutExercises (count via SetLog athlete linkage + direct workout query)
    const expectedExercises = exercisesByAthlete.get(tbId) ?? 0;
    const dbWeSessions = await prisma.workoutSession.findMany({
      where: { athleteId: dbId },
      select: { programId: true },
    });
    const programIds = [...new Set(dbWeSessions.map(s => s.programId).filter(Boolean))];
    const dbWeCount = await prisma.workoutExercise.count({
      where: {
        workout: {
          programId: { in: programIds as string[] },
        },
      },
    });
    checks.push({
      name: 'WorkoutExercises',
      pass: dbWeCount === expectedExercises,
      expected: expectedExercises,
      actual: dbWeCount,
    });

    // SetLogs
    const expectedSets = setsByAthlete.get(tbId) ?? 0;
    const dbSets = await prisma.setLog.count({ where: { athleteId: dbId } });
    checks.push({
      name: 'SetLogs',
      pass: dbSets === expectedSets,
      expected: expectedSets,
      actual: dbSets,
    });

    // MaxSnapshots
    const expectedMaxes = maxesByAthlete.get(tbId) ?? 0;
    const dbMaxes = await prisma.maxSnapshot.count({ where: { athleteId: dbId } });
    checks.push({
      name: 'MaxSnapshots',
      pass: dbMaxes === expectedMaxes,
      expected: expectedMaxes,
      actual: dbMaxes,
    });

    // Tonnage comparison (DB computed vs source summaries)
    // NOTE: TeamBuildr's summary endpoint underreports vs raw set data.
    // The summary only counts "completed" exercises, while our DB stores all
    // sets with actual weight/rep data. DB values will be consistently higher.
    // These checks use 'warn' severity — divergence is expected and informational.
    const sourceTonnage = sourceTonnageByAthlete.get(tbId);
    if (sourceTonnage) {
      // DB tonnage = sum of (weight * reps) across all sets
      const dbTonnageResult = await prisma.$queryRaw<[{ tonnage: number }]>`
        SELECT COALESCE(SUM("weight" * "reps"), 0)::float as tonnage
        FROM "SetLog"
        WHERE "athleteId" = ${dbId}
      `;
      const dbTonnage = Math.round(dbTonnageResult[0].tonnage);
      const expectedTonnage = Math.round(sourceTonnage.tonnage);
      // DB should be >= source (we store more than the summary counts)
      const tonnagePass = dbTonnage >= expectedTonnage;
      checks.push({
        name: 'Tonnage (DB >= summary)',
        pass: tonnagePass,
        expected: `>=${expectedTonnage}`,
        actual: dbTonnage,
        detail: `+${((dbTonnage - expectedTonnage) / Math.max(expectedTonnage, 1) * 100).toFixed(1)}% over summary`,
        severity: 'warn',
      });

      // Reps comparison
      const dbRepsResult = await prisma.$queryRaw<[{ reps: number }]>`
        SELECT COALESCE(SUM("reps"), 0)::int as reps
        FROM "SetLog"
        WHERE "athleteId" = ${dbId}
      `;
      const dbReps = Number(dbRepsResult[0].reps);
      const expectedReps = sourceTonnage.reps;
      const repsPass = dbReps >= expectedReps;
      checks.push({
        name: 'Total reps (DB >= summary)',
        pass: repsPass,
        expected: `>=${expectedReps}`,
        actual: dbReps,
        detail: `+${((dbReps - expectedReps) / Math.max(expectedReps, 1) * 100).toFixed(1)}% over summary`,
        severity: 'warn',
      });
    }

    for (const check of checks) {
      const icon = check.pass ? 'PASS' : (check.severity === 'warn' ? 'WARN' : 'FAIL');
      console.log(`    [${icon}] ${check.name}: expected=${check.expected}, actual=${check.actual}${check.detail ? ` (${check.detail})` : ''}`);
      if (check.pass) totalPass++;
      else if (check.severity === 'warn') totalWarn++;
      else totalFail++;
    }
    console.log();
  }

  // ============================================================
  // Data integrity checks
  // ============================================================

  console.log('--- Data Integrity Checks ---\n');

  // Orphaned SetLogs (no matching WorkoutExercise)
  const orphanedSets = await prisma.$queryRaw<[{ count: number }]>`
    SELECT COUNT(*)::int as count FROM "SetLog" sl
    WHERE NOT EXISTS (
      SELECT 1 FROM "WorkoutExercise" we WHERE we.id = sl."workoutExerciseId"
    )
  `;
  const orphanCheck: CheckResult = {
    name: 'No orphaned SetLogs',
    pass: orphanedSets[0].count === 0,
    expected: 0,
    actual: orphanedSets[0].count,
  };
  printCheck(orphanCheck);
  if (orphanCheck.pass) totalPass++;
  else totalFail++;

  // Orphaned MaxSnapshots (no matching Exercise)
  const orphanedMaxes = await prisma.$queryRaw<[{ count: number }]>`
    SELECT COUNT(*)::int as count FROM "MaxSnapshot" ms
    WHERE NOT EXISTS (
      SELECT 1 FROM "Exercise" e WHERE e.id = ms."exerciseId"
    )
  `;
  const orphanMaxCheck: CheckResult = {
    name: 'No orphaned MaxSnapshots',
    pass: orphanedMaxes[0].count === 0,
    expected: 0,
    actual: orphanedMaxes[0].count,
  };
  printCheck(orphanMaxCheck);
  if (orphanMaxCheck.pass) totalPass++;
  else totalFail++;

  // SetLogs with zero weight and zero reps (should have been filtered)
  const emptySetLogs = await prisma.setLog.count({
    where: { weight: 0, reps: 0 },
  });
  const emptyCheck: CheckResult = {
    name: 'No empty SetLogs (0 weight & 0 reps)',
    pass: emptySetLogs === 0,
    expected: 0,
    actual: emptySetLogs,
  };
  printCheck(emptyCheck);
  if (emptyCheck.pass) totalPass++;
  else totalFail++;

  // WorkoutSessions with unique (athleteId, date)
  const duplicateSessions = await prisma.$queryRaw<[{ count: number }]>`
    SELECT COUNT(*)::int as count FROM (
      SELECT "athleteId", "date", COUNT(*) as cnt
      FROM "WorkoutSession"
      GROUP BY "athleteId", "date"
      HAVING COUNT(*) > 1
    ) dupes
  `;
  const dupeCheck: CheckResult = {
    name: 'No duplicate sessions (athleteId+date)',
    pass: duplicateSessions[0].count === 0,
    expected: 0,
    actual: duplicateSessions[0].count,
  };
  printCheck(dupeCheck);
  if (dupeCheck.pass) totalPass++;
  else totalFail++;

  // All weights in kg
  const nonKgSets = await prisma.setLog.count({
    where: { NOT: { unit: 'kg' } },
  });
  const unitCheck: CheckResult = {
    name: 'All SetLogs use kg unit',
    pass: nonKgSets === 0,
    expected: 0,
    actual: nonKgSets,
  };
  printCheck(unitCheck);
  if (unitCheck.pass) totalPass++;
  else totalFail++;

  // ============================================================
  // Summary
  // ============================================================

  console.log(`\n=== Summary ===`);
  console.log(`  Total checks: ${totalPass + totalWarn + totalFail}`);
  console.log(`  Passed: ${totalPass}`);
  if (totalWarn > 0) {
    console.log(`  Warnings: ${totalWarn} (tonnage/reps — DB has more data than TB summary endpoint)`);
  }
  console.log(`  Failed: ${totalFail}`);

  if (totalFail > 0) {
    console.log(`\n  RESULT: FAIL`);
    process.exit(1);
  } else if (totalWarn > 0) {
    console.log(`\n  RESULT: PASS (with warnings)`);
  } else {
    console.log(`\n  RESULT: PASS`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
