-- CreateEnum
CREATE TYPE "WorkoutSessionStatus" AS ENUM ('NOT_STARTED', 'PARTIALLY_COMPLETED', 'FULLY_COMPLETED');

-- CreateEnum
CREATE TYPE "MaxSnapshotSource" AS ENUM ('WORKOUT', 'MANUAL', 'IMPORT');

-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "programId" TEXT,
    "title" TEXT,
    "durationSeconds" INTEGER,
    "completionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completedItems" INTEGER NOT NULL DEFAULT 0,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "status" "WorkoutSessionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaxSnapshot" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "workingMax" DOUBLE PRECISION NOT NULL,
    "generatedMax" DOUBLE PRECISION,
    "isCurrentMax" BOOLEAN NOT NULL DEFAULT false,
    "source" "MaxSnapshotSource" NOT NULL DEFAULT 'WORKOUT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaxSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkoutSession_athleteId_idx" ON "WorkoutSession"("athleteId");

-- CreateIndex
CREATE INDEX "WorkoutSession_athleteId_date_idx" ON "WorkoutSession"("athleteId", "date");

-- CreateIndex
CREATE INDEX "WorkoutSession_programId_idx" ON "WorkoutSession"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSession_athleteId_date_key" ON "WorkoutSession"("athleteId", "date");

-- CreateIndex
CREATE INDEX "MaxSnapshot_athleteId_idx" ON "MaxSnapshot"("athleteId");

-- CreateIndex
CREATE INDEX "MaxSnapshot_exerciseId_idx" ON "MaxSnapshot"("exerciseId");

-- CreateIndex
CREATE INDEX "MaxSnapshot_athleteId_exerciseId_idx" ON "MaxSnapshot"("athleteId", "exerciseId");

-- CreateIndex
CREATE INDEX "MaxSnapshot_athleteId_date_idx" ON "MaxSnapshot"("athleteId", "date");

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaxSnapshot" ADD CONSTRAINT "MaxSnapshot_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaxSnapshot" ADD CONSTRAINT "MaxSnapshot_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
