-- AlterTable
ALTER TABLE "Coach" ADD COLUMN     "defaultRestTimerSeconds" INTEGER NOT NULL DEFAULT 120,
ADD COLUMN     "defaultWeightUnit" "WeightUnit" NOT NULL DEFAULT 'lbs',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/New_York';
