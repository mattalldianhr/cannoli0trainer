/**
 * Schedule persistence service — creates WorkoutSession records from
 * a generated schedule. Uses Prisma transactions for atomicity.
 *
 * Idempotent: skips dates where a session already exists for the athlete
 * (enforced by the @@unique([athleteId, date]) constraint).
 */

import { prisma } from '@/lib/prisma'
import type { ScheduledSession } from './generate-schedule'

export interface PersistScheduleInput {
  athleteId: string
  programId: string
  programAssignmentId: string
  schedule: ScheduledSession[]
}

export interface PersistScheduleResult {
  created: number
  skipped: number
  total: number
}

/**
 * Persist a generated schedule as WorkoutSession records.
 *
 * For each scheduled session:
 * - If a WorkoutSession already exists for that athlete+date, skip it
 * - Otherwise, create a new WorkoutSession linked to the workout and assignment
 *
 * All creates happen in a single transaction for atomicity.
 *
 * @returns Count of created and skipped sessions
 */
export async function persistSchedule(
  input: PersistScheduleInput
): Promise<PersistScheduleResult> {
  const { athleteId, programId, programAssignmentId, schedule } = input

  if (schedule.length === 0) {
    return { created: 0, skipped: 0, total: 0 }
  }

  // Collect all dates from the schedule to check for existing sessions
  const scheduleDates = schedule.map((s) => s.date)

  // Find existing sessions for this athlete on any of the scheduled dates
  const existingSessions = await prisma.workoutSession.findMany({
    where: {
      athleteId,
      date: { in: scheduleDates },
    },
    select: { date: true },
  })

  // Build a set of existing date strings for fast lookup
  const existingDateSet = new Set(
    existingSessions.map((s) => s.date.toISOString().split('T')[0])
  )

  // Filter to only sessions that don't already exist
  const toCreate = schedule.filter((s) => {
    const dateStr = s.date.toISOString().split('T')[0]
    return !existingDateSet.has(dateStr)
  })

  const skipped = schedule.length - toCreate.length

  if (toCreate.length === 0) {
    return { created: 0, skipped, total: schedule.length }
  }

  // Create all new sessions in a transaction
  await prisma.$transaction(
    toCreate.map((session) =>
      prisma.workoutSession.create({
        data: {
          athleteId,
          date: session.date,
          programId,
          programAssignmentId,
          workoutId: session.workoutId,
          title: session.title,
          weekNumber: session.weekNumber,
          dayNumber: session.dayNumber,
          status: 'NOT_STARTED',
          totalItems: 0,
          completedItems: 0,
          completionPercentage: 0,
        },
      })
    )
  )

  return {
    created: toCreate.length,
    skipped,
    total: schedule.length,
  }
}
