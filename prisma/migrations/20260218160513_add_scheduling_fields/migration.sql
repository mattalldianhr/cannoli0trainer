-- AlterTable
ALTER TABLE "ProgramAssignment" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "trainingDays" JSONB NOT NULL DEFAULT '[1,2,4,5]';

-- AlterTable
ALTER TABLE "WorkoutSession" ADD COLUMN     "dayNumber" INTEGER,
ADD COLUMN     "isManuallyScheduled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSkipped" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "programAssignmentId" TEXT,
ADD COLUMN     "weekNumber" INTEGER,
ADD COLUMN     "workoutId" TEXT;

-- CreateIndex
CREATE INDEX "WorkoutSession_workoutId_idx" ON "WorkoutSession"("workoutId");

-- CreateIndex
CREATE INDEX "WorkoutSession_programAssignmentId_idx" ON "WorkoutSession"("programAssignmentId");

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_programAssignmentId_fkey" FOREIGN KEY ("programAssignmentId") REFERENCES "ProgramAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
