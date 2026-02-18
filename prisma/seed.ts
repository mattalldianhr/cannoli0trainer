import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

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

  // Batch insert for performance — use createMany with skipDuplicates
  // But first we need to check existing exercises to avoid duplicates on re-runs
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
      tags: [],
    }));

  if (toCreate.length > 0) {
    // Prisma createMany doesn't support skipDuplicates for all DBs,
    // but PostgreSQL supports it fine
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
