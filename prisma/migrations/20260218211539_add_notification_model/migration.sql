-- CreateEnum
CREATE TYPE "NotificationRecipientType" AS ENUM ('COACH', 'ATHLETE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PROGRAM_ASSIGNED', 'WORKOUT_COMPLETED', 'CHECK_IN_REMINDER');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientType" "NotificationRecipientType" NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_recipientId_recipientType_idx" ON "Notification"("recipientId", "recipientType");

-- CreateIndex
CREATE INDEX "Notification_recipientId_isRead_idx" ON "Notification"("recipientId", "isRead");
