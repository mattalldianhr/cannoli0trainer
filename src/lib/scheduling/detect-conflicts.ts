/**
 * Conflict detection for overlapping program assignments.
 *
 * Before generating WorkoutSessions, checks if the athlete already has
 * sessions on the target dates from another program assignment. Returns
 * a list of conflicting dates with details about the existing sessions.
 */

import { prisma } from '@/lib/prisma'
import { formatPrismaDate } from '@/lib/date-utils'
import type { ScheduledSession } from './generate-schedule'

export interface ConflictingSession {
  date: Date
  existingTitle: string | null
  existingProgramId: string | null
  existingProgramAssignmentId: string | null
  existingStatus: string
  newTitle: string
}

export interface ConflictDetectionResult {
  hasConflicts: boolean
  conflicts: ConflictingSession[]
  conflictCount: number
}

/**
 * Detect scheduling conflicts for an athlete.
 *
 * Checks if the athlete already has WorkoutSessions on any of the dates
 * in the proposed schedule. Only sessions from a *different* program assignment
 * are considered conflicts (re-assigning the same program is idempotent).
 *
 * @param athleteId - The athlete to check
 * @param schedule - The proposed schedule (from generateSchedule)
 * @param programAssignmentId - The assignment being created (excluded from conflicts)
 * @returns Conflict detection result with details about each conflicting date
 */
export async function detectConflicts(
  athleteId: string,
  schedule: ScheduledSession[],
  programAssignmentId?: string
): Promise<ConflictDetectionResult> {
  if (schedule.length === 0) {
    return { hasConflicts: false, conflicts: [], conflictCount: 0 }
  }

  const scheduleDates = schedule.map((s) => s.date)

  // Find existing sessions for this athlete on any of the scheduled dates
  const existingSessions = await prisma.workoutSession.findMany({
    where: {
      athleteId,
      date: { in: scheduleDates },
      // Exclude sessions from the same assignment (re-assignment is not a conflict)
      ...(programAssignmentId && {
        OR: [
          { programAssignmentId: { not: programAssignmentId } },
          { programAssignmentId: null },
        ],
      }),
    },
    select: {
      date: true,
      title: true,
      programId: true,
      programAssignmentId: true,
      status: true,
    },
  })

  if (existingSessions.length === 0) {
    return { hasConflicts: false, conflicts: [], conflictCount: 0 }
  }

  // Build a lookup from date string to existing session
  const existingByDate = new Map(
    existingSessions.map((s) => [
      formatPrismaDate(s.date),
      s,
    ])
  )

  // Match conflicts with the proposed schedule entries
  const conflicts: ConflictingSession[] = []
  for (const proposed of schedule) {
    const dateStr = formatPrismaDate(proposed.date)
    const existing = existingByDate.get(dateStr)
    if (existing) {
      conflicts.push({
        date: proposed.date,
        existingTitle: existing.title,
        existingProgramId: existing.programId,
        existingProgramAssignmentId: existing.programAssignmentId,
        existingStatus: existing.status,
        newTitle: proposed.title,
      })
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    conflictCount: conflicts.length,
  }
}
