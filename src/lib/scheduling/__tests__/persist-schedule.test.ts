/**
 * Unit tests for the schedule persistence service.
 *
 * Task 17.3 acceptance criteria:
 * - persistSchedule creates WorkoutSession records in a transaction
 * - Links each session to the source Workout via workoutId and ProgramAssignment
 * - Idempotent: skips dates where a session already exists
 * - Returns count of created/skipped sessions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ScheduledSession } from '../generate-schedule'
import type { PersistScheduleInput } from '../persist-schedule'

// Mock Prisma client
const mockFindMany = vi.fn()
const mockCreate = vi.fn()
const mockTransaction = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    workoutSession: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

// Import after mocking
import { persistSchedule } from '../persist-schedule'

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

const baseInput: Omit<PersistScheduleInput, 'schedule'> = {
  athleteId: 'athlete-1',
  programId: 'program-1',
  programAssignmentId: 'assignment-1',
}

// ============================================================
// Tests
// ============================================================

describe('persistSchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: no existing sessions
    mockFindMany.mockResolvedValue([])
    // Default: transaction executes all promises
    mockTransaction.mockImplementation(async (ops: Promise<unknown>[]) => {
      return Promise.all(ops)
    })
    // Default: create returns a stub
    mockCreate.mockResolvedValue({ id: 'new-session' })
  })

  it('returns zeros for empty schedule', async () => {
    const result = await persistSchedule({
      ...baseInput,
      schedule: [],
    })

    expect(result).toEqual({ created: 0, skipped: 0, total: 0 })
    expect(mockFindMany).not.toHaveBeenCalled()
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('creates WorkoutSession records for all scheduled dates', async () => {
    const schedule: ScheduledSession[] = [
      makeSession(1, 1, d(2026, 3, 2)),
      makeSession(1, 2, d(2026, 3, 3)),
      makeSession(1, 3, d(2026, 3, 5)),
      makeSession(1, 4, d(2026, 3, 6)),
    ]

    const result = await persistSchedule({
      ...baseInput,
      schedule,
    })

    expect(result).toEqual({ created: 4, skipped: 0, total: 4 })
    expect(mockTransaction).toHaveBeenCalledOnce()

    // Verify the transaction was called with an array of create operations
    const txArg = mockTransaction.mock.calls[0][0]
    expect(txArg).toHaveLength(4)
  })

  it('passes correct data to each create call', async () => {
    const schedule: ScheduledSession[] = [
      makeSession(1, 1, d(2026, 3, 2), 'workout-abc'),
    ]

    await persistSchedule({ ...baseInput, schedule })

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        athleteId: 'athlete-1',
        date: d(2026, 3, 2),
        programId: 'program-1',
        programAssignmentId: 'assignment-1',
        workoutId: 'workout-abc',
        title: 'Week 1 Day 1',
        weekNumber: 1,
        dayNumber: 1,
        status: 'NOT_STARTED',
        totalItems: 0,
        completedItems: 0,
        completionPercentage: 0,
      },
    })
  })

  it('skips dates where sessions already exist', async () => {
    // Simulate existing sessions on Mar 2 and Mar 5
    mockFindMany.mockResolvedValue([
      { date: d(2026, 3, 2) },
      { date: d(2026, 3, 5) },
    ])

    const schedule: ScheduledSession[] = [
      makeSession(1, 1, d(2026, 3, 2)),
      makeSession(1, 2, d(2026, 3, 3)),
      makeSession(1, 3, d(2026, 3, 5)),
      makeSession(1, 4, d(2026, 3, 6)),
    ]

    const result = await persistSchedule({ ...baseInput, schedule })

    expect(result).toEqual({ created: 2, skipped: 2, total: 4 })

    // Transaction should only have 2 creates (Mar 3 and Mar 6)
    const txArg = mockTransaction.mock.calls[0][0]
    expect(txArg).toHaveLength(2)
  })

  it('returns all skipped when every date already has a session', async () => {
    mockFindMany.mockResolvedValue([
      { date: d(2026, 3, 2) },
      { date: d(2026, 3, 3) },
    ])

    const schedule: ScheduledSession[] = [
      makeSession(1, 1, d(2026, 3, 2)),
      makeSession(1, 2, d(2026, 3, 3)),
    ]

    const result = await persistSchedule({ ...baseInput, schedule })

    expect(result).toEqual({ created: 0, skipped: 2, total: 2 })
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('queries existing sessions with correct athleteId and dates', async () => {
    const schedule: ScheduledSession[] = [
      makeSession(1, 1, d(2026, 3, 2)),
      makeSession(1, 2, d(2026, 3, 3)),
    ]

    await persistSchedule({ ...baseInput, schedule })

    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        athleteId: 'athlete-1',
        date: { in: [d(2026, 3, 2), d(2026, 3, 3)] },
      },
      select: { date: true },
    })
  })

  it('handles a full 4-week 4-day program (16 sessions)', async () => {
    const schedule: ScheduledSession[] = []
    let dateCounter = 0
    const baseDates = [
      // Week 1: Mon-Fri
      d(2026, 3, 2), d(2026, 3, 3), d(2026, 3, 5), d(2026, 3, 6),
      // Week 2
      d(2026, 3, 9), d(2026, 3, 10), d(2026, 3, 12), d(2026, 3, 13),
      // Week 3
      d(2026, 3, 16), d(2026, 3, 17), d(2026, 3, 19), d(2026, 3, 20),
      // Week 4
      d(2026, 3, 23), d(2026, 3, 24), d(2026, 3, 26), d(2026, 3, 27),
    ]

    for (let week = 1; week <= 4; week++) {
      for (let day = 1; day <= 4; day++) {
        schedule.push(makeSession(week, day, baseDates[dateCounter++]))
      }
    }

    const result = await persistSchedule({ ...baseInput, schedule })

    expect(result).toEqual({ created: 16, skipped: 0, total: 16 })
    expect(mockTransaction).toHaveBeenCalledOnce()
    const txArg = mockTransaction.mock.calls[0][0]
    expect(txArg).toHaveLength(16)
  })

  it('links each session to the programAssignment', async () => {
    const schedule: ScheduledSession[] = [
      makeSession(1, 1, d(2026, 3, 2)),
    ]

    await persistSchedule({
      athleteId: 'ath-xyz',
      programId: 'prog-123',
      programAssignmentId: 'asgn-456',
      schedule,
    })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          athleteId: 'ath-xyz',
          programId: 'prog-123',
          programAssignmentId: 'asgn-456',
        }),
      })
    )
  })
})
