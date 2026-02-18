-- AlterTable
ALTER TABLE "WorkoutExercise" ADD COLUMN     "isUnilateral" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "restTimeSeconds" INTEGER,
ADD COLUMN     "supersetColor" TEXT,
ADD COLUMN     "supersetGroup" TEXT,
ADD COLUMN     "tempo" TEXT;
