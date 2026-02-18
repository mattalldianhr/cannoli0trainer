/**
 * Unit tests for the conflict detection service.
 *
 * Task 17.5 acceptance criteria:
 * - Before generating sessions, check for existing WorkoutSessions on target dates
 * - If conflicts found, return them in the API response
 * - Coach can choose to proceed (overwrite) or cancel
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ScheduledSession } from '../generate-schedule'

// Mock Prisma client
const mockFindMany = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    workoutSession: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}))

// Import after mocking
import { detectConflicts } from '../detect-conflicts'

// ============================================================
// Helpers
// ============================================================

function makeSession(
  weekNumber: number,
  dayNumber: number,
  date: Date,
  workoutId?: string
): ScheduledSession {
  return {
    date,
    workoutId: workoutId ?? `w${weekNumber}d${dayNumber}`,
    weekNumber,
    dayNumber,
    title: `Week ${weekNumber} Day ${dayNumber}`,
  }
}

function d(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day)
}

// ============================================================
// Tests
// ============================================================

describe('detectConflicts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindMany.mockResolvedValue([])
  })

  it('returns no conflicts for empty schedule', async () => {
    const result = await detectConflicts('athlete-1', [])

    expect(result).toEqual({
      hasConflicts: false,
      conflicts: [],
      conflictCount: 0,
    })
    expect(mockFindMany).not.toHaveBeenCalled()
  })

  it('returns no conflicts when no existing sessions on target dates', async () => {
    const schedule: ScheduledSession[] = [
      makeSession(1, 1, d(2026, 3, 2)),
      makeSession(1, 2, d(2026, 3, 3)),
    ]

    const result = await detectConflicts('athlete-1', schedule)

    expect(result).toEqual({
      hasConflicts: false,
      conflicts: [],
      conflictCount: 0,
    })
  })

  it('detects conflicts when existing sessions overlap', async () => {
    mockFindMany.mockResolvedValue([
      {
        date: d(2026, 3, 2),
        title: 'Existing Squat Day',
        programId: 'other-program',
        programAssignmentId: 'other-assignment',
        status: 'NOT_STARTED',
      },
    ])

    const schedule: ScheduledSession[] = [
      makeSession(1, 1, d(2026, 3, 2)),
      makeSession(1, 2, d(2026, 3, 3)),
    ]

    const result = await detectConflicts('athlete-1', schedule)

    expect(result.hasConflicts).toBe(true)
    expect(result.conflictCount).toBe(1)
    expect(result.conflicts).toHaveLength(1)
    expect(result.conflicts[0]).toEqual({
      date: d(2026, 3, 2),
      existingTitle: 'Existing Squat Day',
      existingProgramId: 'other-program',
      existingProgramAssignmentId: 'other-assignment',
      existingStatus: 'NOT_STARTED',
      newTitle: 'Week 1 Day 1',
    })
  })

  it('detects multiple conflicts', async () => {
    mockFindMany.mockResolvedValue([
      {
        date: d(2026, 3, 2),
        title: 'Squat Day',
        programId: 'other-prog',
        programAssignmentId: 'other-asgn',
        status: 'NOT_STARTED',
      },
      {
        date: d(2026, 3, 5),
        title: 'Deadlift Day',
        programId: 'other-prog',
        programAssignmentId: 'other-asgn',
        status: 'PARTIALLY_COMPLETED',
      },
    ])

    const schedule: ScheduledSession[] = [
      makeSession(1, 1, d(2026, 3, 2)),
      makeSession(1, 2, d(2026, 3, 3)),
      makeSession(1, 3, d(2026, 3, 5)),
      makeSession(1, 4, d(2026, 3, 6)),
    ]

    const result = await detectConflicts('athlete-1', schedule)

    expect(result.hasConflicts).toBe(true)
    expect(result.conflictCount).toBe(2)
    expect(result.conflicts[0].existingTitle).toBe('Squat Day')
    expect(result.conflicts[0].newTitle).toBe('Week 1 Day 1')
    expect(result.conflicts[1].existingTitle).toBe('Deadlift Day')
    expect(result.conflicts[1].newTitle).toBe('Week 1 Day 3')
  })

  it('excludes sessions from the same assignment (re-assignment)', async () => {
    // When checking with a programAssignmentId, sessions from the same
    // assignment are excluded — re-assigning the same program is not a conflict
    const schedule: ScheduledSession[] = [
      makeSession(1, 1, d(2026, 3, 2)),
    ]

    await detectConflicts('athlete-1', schedule, 'my-assignment')

    // Should use OR filter to exclude same assignment
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        athleteId: 'athlete-1',
        date: { in: [d(2026, 3, 2)] },
        OR: [
          { programAssignmentId: { not: 'my-assignment' } },
          { programAssignmentId: null },
        ],
      },
      select: {
        date: true,
        title: true,
        programId: true,
        programAssignmentId: true,
        status: true,
      },
    })
  })

  it('does not filter by assignment when no assignmentId provided', async () => {
    const schedule: ScheduledSession[] = [
      makeSession(1, 1, d(2026, 3, 2)),
    ]

    await detectConflicts('athlete-1', schedule)

    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        athleteId: 'athlete-1',
        date: { in: [d(2026, 3, 2)] },
      },
      select: {
        date: true,
        title: true,
        programId: true,
        programAssignmentId: true,
        status: true,
      },
    })
  })

  it('handles conflicts with null titles (imported sessions)', async () => {
    mockFindMany.mockResolvedValue([
      {
        date: d(2026, 3, 2),
        title: null,
        programId: null,
        programAssignmentId: null,
        status: 'FULLY_COMPLETED',
      },
    ])

    const schedule: ScheduledSession[] = [
      makeSession(1, 1, d(2026, 3, 2)),
    ]

    const result = await detectConflicts('athlete-1', schedule)

    expect(result.hasConflicts).toBe(true)
    expect(result.conflicts[0].existingTitle).toBeNull()
    expect(result.conflicts[0].existingStatus).toBe('FULLY_COMPLETED')
  })

  it('returns correct structure for full 4-week program with partial overlap', async () => {
    // 3 out of 16 dates conflict
    mockFindMany.mockResolvedValue([
      { date: d(2026, 3, 2), title: 'A', programId: 'p', programAssignmentId: 'a', status: 'NOT_STARTED' },
      { date: d(2026, 3, 9), title: 'B', programId: 'p', programAssignmentId: 'a', status: 'NOT_STARTED' },
      { date: d(2026, 3, 16), title: 'C', programId: 'p', programAssignmentId: 'a', status: 'NOT_STARTED' },
    ])

    const schedule: ScheduledSession[] = []
    const dates = [
      d(2026, 3, 2), d(2026, 3, 3), d(2026, 3, 5), d(2026, 3, 6),
      d(2026, 3, 9), d(2026, 3, 10), d(2026, 3, 12), d(2026, 3, 13),
      d(2026, 3, 16), d(2026, 3, 17), d(2026, 3, 19), d(2026, 3, 20),
      d(2026, 3, 23), d(2026, 3, 24), d(2026, 3, 26), d(2026, 3, 27),
    ]
    let i = 0
    for (let w = 1; w <= 4; w++) {
      for (let day = 1; day <= 4; day++) {
        schedule.push(makeSession(w, day, dates[i++]))
      }
    }

    const result = await detectConflicts('athlete-1', schedule)

    expect(result.hasConflicts).toBe(true)
    expect(result.conflictCount).toBe(3)
    expect(result.conflicts.map(c => c.date)).toEqual([
      d(2026, 3, 2),
      d(2026, 3, 9),
      d(2026, 3, 16),
    ])
  })
})
