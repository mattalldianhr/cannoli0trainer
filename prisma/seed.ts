import { PrismaClient } from '@prisma/client';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  freeExerciseDbTags,
  teambuildrNewExercises,
} from './seed-data/exercise-tags';
import type { TeamBuildrExport } from '../src/lib/teambuildr/types';

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

async function main() {
  console.log('Starting seed...\n');

  await seedExercises();
  await seedTeambuildrExercises();
  await seedCoachAndAthletes();

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
