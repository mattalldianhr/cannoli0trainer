-- DropForeignKey
ALTER TABLE "Exercise" DROP CONSTRAINT "Exercise_coachId_fkey";

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "equipment" TEXT,
ADD COLUMN     "force" TEXT,
ADD COLUMN     "images" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "instructions" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "level" TEXT,
ADD COLUMN     "mechanic" TEXT,
ADD COLUMN     "primaryMuscles" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "secondaryMuscles" JSONB NOT NULL DEFAULT '[]',
ALTER COLUMN "coachId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Exercise_name_idx" ON "Exercise"("name");

-- CreateIndex
CREATE INDEX "Exercise_category_idx" ON "Exercise"("category");

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE SET NULL ON UPDATE CASCADE;
