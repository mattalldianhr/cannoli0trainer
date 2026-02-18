-- AlterTable
ALTER TABLE "Athlete" ADD COLUMN     "notificationPreferences" JSONB NOT NULL DEFAULT '{"emailOnProgramAssigned":true}';

-- AlterTable
ALTER TABLE "Coach" ADD COLUMN     "notificationPreferences" JSONB NOT NULL DEFAULT '{"emailOnWorkoutComplete":true,"emailOnCheckIn":true}';
