/**
 * Cleanup service for program assignment removal.
 *
 * When a ProgramAssignment is deleted or deactivated, this service
 * deletes all future NOT_STARTED WorkoutSessions linked to that
 * assignment. Sessions that are PARTIALLY_COMPLETED or FULLY_COMPLETED
 * are preserved — the athlete's logged work is never deleted.
 */

import { prisma } from '@/lib/prisma'

export interface CleanupResult {
  deleted: number
  preserved: number
}

/**
 * Delete future NOT_STARTED WorkoutSessions for a given program assignment.
 *
 * @param programAssignmentId - The assignment being removed/deactivated
 * @param asOfDate - The cutoff date (defaults to today). Sessions on or after
 *   this date with status NOT_STARTED are deleted.
 * @returns Count of deleted and preserved sessions
 */
export async function cleanupAssignmentSessions(
  programAssignmentId: string,
  asOfDate: Date = new Date()
): Promise<CleanupResult> {
  // Normalize to start of day (UTC) for date comparison
  const cutoff = new Date(asOfDate)
  cutoff.setUTCHours(0, 0, 0, 0)

  // Count sessions that will be preserved (completed or in-progress)
  const preserved = await prisma.workoutSession.count({
    where: {
      programAssignmentId,
      date: { gte: cutoff },
      status: { in: ['PARTIALLY_COMPLETED', 'FULLY_COMPLETED'] },
    },
  })

  // Delete future NOT_STARTED sessions
  const { count: deleted } = await prisma.workoutSession.deleteMany({
    where: {
      programAssignmentId,
      date: { gte: cutoff },
      status: 'NOT_STARTED',
    },
  })

  return { deleted, preserved }
}

/**
 * Deactivate a program assignment and clean up its future sessions.
 *
 * Sets `isActive = false` on the assignment and deletes future
 * NOT_STARTED sessions in a single transaction.
 *
 * @returns The updated assignment and cleanup results
 */
export async function deactivateAssignment(
  programAssignmentId: string,
  asOfDate: Date = new Date()
) {
  const cutoff = new Date(asOfDate)
  cutoff.setUTCHours(0, 0, 0, 0)

  // Count preserved sessions first (outside transaction is fine for counts)
  const preserved = await prisma.workoutSession.count({
    where: {
      programAssignmentId,
      date: { gte: cutoff },
      status: { in: ['PARTIALLY_COMPLETED', 'FULLY_COMPLETED'] },
    },
  })

  // Deactivate + delete in a transaction
  const [assignment, deleteResult] = await prisma.$transaction([
    prisma.programAssignment.update({
      where: { id: programAssignmentId },
      data: { isActive: false },
      include: {
        athlete: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
      },
    }),
    prisma.workoutSession.deleteMany({
      where: {
        programAssignmentId,
        date: { gte: cutoff },
        status: 'NOT_STARTED',
      },
    }),
  ])

  return {
    assignment,
    cleanup: {
      deleted: deleteResult.count,
      preserved,
    },
  }
}

/**
 * Delete a program assignment entirely and clean up its future sessions.
 *
 * Deletes future NOT_STARTED sessions, then deletes the assignment record.
 * Past/completed sessions are preserved (their programAssignmentId becomes
 * null via the onDelete: SetNull relation).
 *
 * @returns Cleanup results
 */
export async function deleteAssignment(
  programAssignmentId: string,
  asOfDate: Date = new Date()
) {
  const cutoff = new Date(asOfDate)
  cutoff.setUTCHours(0, 0, 0, 0)

  // Count preserved sessions
  const preserved = await prisma.workoutSession.count({
    where: {
      programAssignmentId,
      date: { gte: cutoff },
      status: { in: ['PARTIALLY_COMPLETED', 'FULLY_COMPLETED'] },
    },
  })

  // Delete future NOT_STARTED sessions, then delete the assignment
  const [deleteSessionsResult] = await prisma.$transaction([
    prisma.workoutSession.deleteMany({
      where: {
        programAssignmentId,
        date: { gte: cutoff },
        status: 'NOT_STARTED',
      },
    }),
    prisma.programAssignment.delete({
      where: { id: programAssignmentId },
    }),
  ])

  return {
    deleted: deleteSessionsResult.count,
    preserved,
  }
}
