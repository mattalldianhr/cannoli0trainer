import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  freeExerciseDbTags,
  teambuildrNewExercises,
} from './seed-data/exercise-tags';

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

async function main() {
  console.log('Starting seed...\n');

  await seedExercises();
  await seedTeambuildrExercises();

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
