import { PrismaClient, PrescriptionType, WeightUnit, WorkoutSessionStatus, MaxSnapshotSource } from '@prisma/client';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  freeExerciseDbTags,
  teambuildrNewExercises,
} from './seed-data/exercise-tags';
import type { TeamBuildrExport } from '../src/lib/teambuildr/types';
import {
  transformTeamBuildrExport,
  deduplicateMaxSnapshots,
  type TransformedSession,
  type TransformedWorkoutExercise,
  type TransformedMaxSnapshot,
} from '../src/lib/teambuildr/transformer';

const prisma = new PrismaClient();

interface FreeExerciseDbEntry {
  id: string;
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
}

async function seedExercises() {
  const dataPath = join(__dirname, 'seed-data', 'exercises.json');
  const raw = readFileSync(dataPath, 'utf-8');
  const exercises: FreeExerciseDbEntry[] = JSON.parse(raw);

  console.log(`Loading ${exercises.length} exercises from free-exercise-db...`);

  let created = 0;
  let skipped = 0;

  // Check existing exercises to avoid duplicates on re-runs
  const existing = await prisma.exercise.findMany({
    where: { coachId: null },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((e) => e.name));

  const toCreate = exercises
    .filter((ex) => {
      if (existingNames.has(ex.name)) {
        skipped++;
        return false;
      }
      return true;
    })
    .map((ex) => ({
      name: ex.name,
      category: ex.category,
      force: ex.force,
      level: ex.level,
      mechanic: ex.mechanic,
      equipment: ex.equipment,
      primaryMuscles: ex.primaryMuscles,
      secondaryMuscles: ex.secondaryMuscles,
      instructions: ex.instructions,
      images: ex.images,
      tags: freeExerciseDbTags[ex.name] ?? [],
    }));

  if (toCreate.length > 0) {
    const result = await prisma.exercise.createMany({
      data: toCreate,
      skipDuplicates: true,
    });
    created = result.count;
  }

  console.log(`  Created: ${created}`);
  console.log(`  Skipped (already exist): ${skipped}`);

  // Apply tags to existing exercises that were previously seeded without tags
  let tagged = 0;
  for (const [name, tags] of Object.entries(freeExerciseDbTags)) {
    if (existingNames.has(name)) {
      await prisma.exercise.updateMany({
        where: { name, coachId: null },
        data: { tags },
      });
      tagged++;
    }
  }
  if (tagged > 0) {
    console.log(`  Updated tags on ${tagged} existing exercises`);
  }

  const total = await prisma.exercise.count();
  console.log(`  Total exercises in database: ${total}`);
}

async function seedTeambuildrExercises() {
  console.log(
    `\nCreating ${teambuildrNewExercises.length} TeamBuildr-specific exercises...`
  );

  const existing = await prisma.exercise.findMany({
    where: { coachId: null },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((e) => e.name));

  let created = 0;
  let skipped = 0;

  const toCreate = teambuildrNewExercises
    .filter((ex) => {
      if (existingNames.has(ex.name)) {
        skipped++;
        return false;
      }
      return true;
    })
    .map((ex) => ({
      name: ex.name,
      category: ex.category,
      tags: ex.tags,
      equipment: ex.equipment,
      primaryMuscles: ex.primaryMuscles,
      secondaryMuscles: ex.secondaryMuscles,
      force: ex.force,
      level: ex.level,
      mechanic: ex.mechanic,
      instructions: [],
      images: [],
    }));

  if (toCreate.length > 0) {
    const result = await prisma.exercise.createMany({
      data: toCreate,
      skipDuplicates: true,
    });
    created = result.count;
  }

  console.log(`  Created: ${created}`);
  console.log(`  Skipped (already exist): ${skipped}`);

  const total = await prisma.exercise.count();
  console.log(`  Total exercises in database: ${total}`);
}

// ============================================================
// Coach & Athletes from TeamBuildr export
// ============================================================

function loadTeamBuildrExport(): TeamBuildrExport | null {
  const exportPath = join(__dirname, '..', 'test-data', 'teambuildr-full-export-5-athletes.json');
  if (!existsSync(exportPath)) {
    console.log('\n⚠ TeamBuildr export not found at test-data/teambuildr-full-export-5-athletes.json');
    console.log('  Skipping coach & athlete seeding. Run the export script first.');
    return null;
  }
  const raw = readFileSync(exportPath, 'utf-8');
  return JSON.parse(raw) as TeamBuildrExport;
}

async function seedCoachAndAthletes() {
  const data = loadTeamBuildrExport();
  if (!data) return;

  console.log('\nSeeding coach and athletes from TeamBuildr export...');

  // Upsert coach: Joe Cristando (Cannoli Strength)
  const coach = await prisma.coach.upsert({
    where: { email: 'joe@cannolistrength.com' },
    update: { name: 'Joe Cristando', brandName: 'Cannoli Strength' },
    create: {
      name: 'Joe Cristando',
      email: 'joe@cannolistrength.com',
      brandName: 'Cannoli Strength',
    },
  });
  console.log(`  Coach: ${coach.name} (${coach.id})`);

  // Create athletes from export profiles
  let created = 0;
  let updated = 0;

  for (const [, athleteData] of Object.entries(data.athletes)) {
    const profile = athleteData.profile;
    const firstName = profile.first.trim();
    const lastName = profile.last.trim();
    const fullName = `${firstName} ${lastName}`;
    const groups = (profile.groupAssignments || []).map(g => g.name);
    // Deduplicate groups (Hannah has "Joe's Athletes" twice)
    const uniqueGroups = [...new Set(groups)];

    const dateRange = athleteData.dateRange;

    // Use upsert keyed on coachId + name to be idempotent
    const existing = await prisma.athlete.findFirst({
      where: { coachId: coach.id, name: fullName },
    });

    const athleteFields = {
      coachId: coach.id,
      name: fullName,
      isRemote: true,
      isCompetitor: true,
      metadata: {
        teambuildrId: profile.id,
        teambuildrGroups: uniqueGroups,
        dateRange: {
          first: dateRange.first,
          last: dateRange.last,
          totalDates: dateRange.totalDates,
        },
      },
    };

    if (existing) {
      await prisma.athlete.update({
        where: { id: existing.id },
        data: athleteFields,
      });
      updated++;
      console.log(`  Updated: ${fullName} (TB#${profile.id}, ${dateRange.totalDates} dates: ${dateRange.first} → ${dateRange.last})`);
    } else {
      const athlete = await prisma.athlete.create({ data: athleteFields });
      created++;
      console.log(`  Created: ${fullName} (TB#${profile.id}, ${dateRange.totalDates} dates: ${dateRange.first} → ${dateRange.last}) → ${athlete.id}`);
    }
  }

  console.log(`  Athletes created: ${created}, updated: ${updated}`);

  // Summary
  const totalAthletes = await prisma.athlete.count({ where: { coachId: coach.id } });
  console.log(`  Total athletes for ${coach.name}: ${totalAthletes}`);
}

// ============================================================
// Workout History Import from TeamBuildr export
// ============================================================

async function seedWorkoutHistory() {
  const data = loadTeamBuildrExport();
  if (!data) return;

  console.log('\nImporting workout history from TeamBuildr export...');

  // Check if already imported (idempotent)
  const existingSessions = await prisma.workoutSession.count();
  if (existingSessions > 0) {
    console.log(`  Already imported (${existingSessions} sessions). Skipping.`);
    console.log('  To re-import, delete existing WorkoutSessions first.');
    return;
  }

  // Run the transformer
  console.log('  Transforming TeamBuildr data...');
  const transformed = transformTeamBuildrExport(data);
  const { sessions, workoutExercises, maxSnapshots, stats } = transformed;

  console.log(`  Transform stats:`);
  console.log(`    Dates: ${stats.totalDates}`);
  console.log(`    Workout items: ${stats.totalWorkoutItems}`);
  console.log(`    Lift items: ${stats.totalLiftItems}`);
  console.log(`    Sets: ${stats.totalSets}`);
  console.log(`    Max snapshots (raw): ${stats.totalMaxSnapshots}`);
  console.log(`    Skipped non-exercises: ${stats.skippedNonExercises}`);
  console.log(`    Skipped no data: ${stats.skippedNoData}`);

  // Build lookup: athlete TB ID -> DB athlete record
  const coach = await prisma.coach.findFirst({ where: { email: 'joe@cannolistrength.com' } });
  if (!coach) {
    console.log('  ERROR: Coach not found. Run seedCoachAndAthletes first.');
    return;
  }

  const dbAthletes = await prisma.athlete.findMany({
    where: { coachId: coach.id },
    select: { id: true, name: true, metadata: true },
  });

  const athleteTbIdToDbId = new Map<number, string>();
  for (const athlete of dbAthletes) {
    const meta = athlete.metadata as { teambuildrId?: number } | null;
    if (meta?.teambuildrId) {
      athleteTbIdToDbId.set(meta.teambuildrId, athlete.id);
    }
  }
  console.log(`  Mapped ${athleteTbIdToDbId.size} athletes (TB ID -> DB ID)`);

  // Build lookup: exercise name -> DB exercise ID
  const dbExercises = await prisma.exercise.findMany({
    select: { id: true, name: true },
  });
  const exerciseNameToId = new Map<string, string>();
  for (const ex of dbExercises) {
    exerciseNameToId.set(ex.name, ex.id);
  }
  console.log(`  Loaded ${exerciseNameToId.size} exercises for name resolution`);

  // Create one "TeamBuildr Import" Program per athlete
  const athletePrograms = new Map<string, string>(); // athleteDbId -> programId
  for (const [tbId, dbId] of athleteTbIdToDbId) {
    const athleteName = dbAthletes.find(a => a.id === dbId)?.name ?? `Athlete ${tbId}`;
    const program = await prisma.program.create({
      data: {
        coachId: coach.id,
        name: `TeamBuildr Import - ${athleteName}`,
        description: 'Imported workout history from TeamBuildr',
        type: 'individual',
      },
    });
    athletePrograms.set(dbId, program.id);

    // Create assignment
    await prisma.programAssignment.create({
      data: {
        programId: program.id,
        athleteId: dbId,
      },
    });
  }
  console.log(`  Created ${athletePrograms.size} import programs`);

  // Group sessions and exercises by athlete+date for batch processing
  const sessionsByKey = new Map<string, TransformedSession>();
  for (const session of sessions) {
    const key = `${session.athleteTbId}:${session.date}`;
    sessionsByKey.set(key, session);
  }

  const exercisesByKey = new Map<string, TransformedWorkoutExercise[]>();
  for (const ex of workoutExercises) {
    const key = `${ex.athleteTbId}:${ex.date}`;
    const arr = exercisesByKey.get(key) ?? [];
    arr.push(ex);
    exercisesByKey.set(key, arr);
  }

  // Track missing exercises
  const missingExercises = new Set<string>();

  // Process each session date
  let sessionsCreated = 0;
  let workoutsCreated = 0;
  let exercisesCreated = 0;
  let setsCreated = 0;
  let weekNumber = 1;
  let dayInWeek = 0;

  // Sort sessions by date for consistent week/day numbering
  const sortedKeys = Array.from(sessionsByKey.keys()).sort();

  // Batch size for processing
  const BATCH_SIZE = 50;

  for (let batchStart = 0; batchStart < sortedKeys.length; batchStart += BATCH_SIZE) {
    const batchKeys = sortedKeys.slice(batchStart, batchStart + BATCH_SIZE);

    for (const key of batchKeys) {
      const session = sessionsByKey.get(key)!;
      const athleteDbId = athleteTbIdToDbId.get(session.athleteTbId);
      if (!athleteDbId) continue;

      const programId = athletePrograms.get(athleteDbId);
      if (!programId) continue;

      dayInWeek++;
      if (dayInWeek > 7) {
        dayInWeek = 1;
        weekNumber++;
      }

      // Create WorkoutSession
      await prisma.workoutSession.create({
        data: {
          athleteId: athleteDbId,
          date: new Date(session.date),
          programId,
          title: session.title,
          durationSeconds: session.durationSeconds || null,
          completionPercentage: session.completionPercentage,
          completedItems: session.completedItems,
          totalItems: session.totalItems,
          status: session.status as WorkoutSessionStatus,
        },
      });
      sessionsCreated++;

      // Create Workout (container for WorkoutExercises)
      const workout = await prisma.workout.create({
        data: {
          programId,
          name: session.title ?? `Workout ${session.date}`,
          dayNumber: dayInWeek,
          weekNumber,
          notes: null,
        },
      });
      workoutsCreated++;

      // Create WorkoutExercises and SetLogs for this date
      const dateExercises = exercisesByKey.get(key) ?? [];

      for (const ex of dateExercises) {
        const exerciseDbId = exerciseNameToId.get(ex.exerciseName);
        if (!exerciseDbId) {
          missingExercises.add(ex.exerciseName);
          continue;
        }

        // Map prescription type
        let prescriptionType: PrescriptionType = PrescriptionType.fixed;
        if (ex.prescriptionType === 'percentage') prescriptionType = PrescriptionType.percentage;
        else if (ex.prescriptionType === 'rpe') prescriptionType = PrescriptionType.rpe;

        const workoutExercise = await prisma.workoutExercise.create({
          data: {
            workoutId: workout.id,
            exerciseId: exerciseDbId,
            order: ex.order,
            prescriptionType,
            prescribedSets: ex.prescribedSets != null ? String(ex.prescribedSets) : null,
            prescribedReps: ex.prescribedReps != null ? String(ex.prescribedReps) : null,
            prescribedLoad: ex.prescribedLoad != null ? String(ex.prescribedLoad) : null,
            prescribedRPE: ex.prescribedRPE != null ? Number(ex.prescribedRPE) : null,
            percentageOf1RM: ex.percentageOf1RM != null ? Number(ex.percentageOf1RM) : null,
            supersetGroup: ex.supersetGroup,
            supersetColor: ex.supersetColor,
            isUnilateral: ex.isUnilateral,
            restTimeSeconds: ex.restTimeSeconds != null ? Number(ex.restTimeSeconds) : null,
            tempo: ex.tempo,
            notes: ex.notes,
          },
        });
        exercisesCreated++;

        // Create SetLogs
        if (ex.sets.length > 0) {
          await prisma.setLog.createMany({
            data: ex.sets.map(set => ({
              workoutExerciseId: workoutExercise.id,
              athleteId: athleteDbId,
              setNumber: Number(set.setNumber) || 1,
              reps: Number(set.reps) || 0,
              weight: Number(set.weight) || 0,
              unit: WeightUnit.kg,
              rpe: set.rpe != null ? Number(set.rpe) : null,
              velocity: set.velocity != null ? Number(set.velocity) : null,
              completedAt: new Date(ex.date),
            })),
          });
          setsCreated += ex.sets.length;
        }
      }
    }

    // Progress update every batch
    const progress = Math.min(batchStart + BATCH_SIZE, sortedKeys.length);
    if (progress % 200 === 0 || progress >= sortedKeys.length) {
      console.log(`  Progress: ${progress}/${sortedKeys.length} sessions processed`);
    }
  }

  console.log(`\n  Workout history import complete:`);
  console.log(`    Sessions: ${sessionsCreated}`);
  console.log(`    Workouts: ${workoutsCreated}`);
  console.log(`    Exercises: ${exercisesCreated}`);
  console.log(`    Sets: ${setsCreated}`);

  if (missingExercises.size > 0) {
    console.log(`\n  WARNING: ${missingExercises.size} exercises not found in DB:`);
    for (const name of Array.from(missingExercises).sort()) {
      console.log(`    - "${name}"`);
    }
  }

  // Import MaxSnapshots (deduplicated)
  console.log('\n  Importing max snapshots...');
  const dedupedMaxes = deduplicateMaxSnapshots(maxSnapshots);
  console.log(`    Raw: ${maxSnapshots.length}, Deduplicated: ${dedupedMaxes.length}`);

  let maxesCreated = 0;
  let maxesSkipped = 0;

  // Process in batches
  const MAX_BATCH = 500;
  for (let i = 0; i < dedupedMaxes.length; i += MAX_BATCH) {
    const batch = dedupedMaxes.slice(i, i + MAX_BATCH);

    const batchData = batch
      .map(snap => {
        const athleteDbId = athleteTbIdToDbId.get(snap.athleteTbId);
        const exerciseDbId = exerciseNameToId.get(snap.exerciseName);
        if (!athleteDbId || !exerciseDbId) {
          maxesSkipped++;
          return null;
        }
        return {
          athleteId: athleteDbId,
          exerciseId: exerciseDbId,
          date: new Date(snap.date),
          workingMax: snap.workingMax,
          generatedMax: snap.generatedMax,
          isCurrentMax: snap.isCurrentMax,
          source: snap.source as MaxSnapshotSource,
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);

    if (batchData.length > 0) {
      const result = await prisma.maxSnapshot.createMany({
        data: batchData,
      });
      maxesCreated += result.count;
    }
  }

  console.log(`    Created: ${maxesCreated}`);
  if (maxesSkipped > 0) {
    console.log(`    Skipped (missing athlete/exercise): ${maxesSkipped}`);
  }

  // Final verification counts
  console.log('\n  Database verification:');
  const dbSessions = await prisma.workoutSession.count();
  const dbWorkoutExercises = await prisma.workoutExercise.count();
  const dbSetLogs = await prisma.setLog.count();
  const dbMaxSnapshots = await prisma.maxSnapshot.count();
  console.log(`    WorkoutSessions: ${dbSessions}`);
  console.log(`    WorkoutExercises: ${dbWorkoutExercises}`);
  console.log(`    SetLogs: ${dbSetLogs}`);
  console.log(`    MaxSnapshots: ${dbMaxSnapshots}`);
}

async function main() {
  console.log('Starting seed...\n');

  await seedExercises();
  await seedTeambuildrExercises();
  await seedCoachAndAthletes();
  await seedWorkoutHistory();

  // Print tag summary
  const taggedCount = await prisma.exercise.count({
    where: {
      NOT: { tags: { equals: [] } },
    },
  });
  console.log(`\nExercises with powerlifting tags: ${taggedCount}`);

  console.log('\nSeed complete.');
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
