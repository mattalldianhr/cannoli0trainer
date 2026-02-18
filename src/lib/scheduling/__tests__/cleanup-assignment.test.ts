/**
 * Unit tests for the assignment cleanup service.
 *
 * Task 17.6 acceptance criteria:
 * - When a ProgramAssignment is deleted or isActive set to false,
 *   delete all WorkoutSessions where programAssignmentId matches
 *   AND status = NOT_STARTED AND date >= today
 * - Preserve sessions with status PARTIALLY_COMPLETED or FULLY_COMPLETED
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma client
const mockCount = vi.fn()
const mockDeleteMany = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockTransaction = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    workoutSession: {
      count: (...args: unknown[]) => mockCount(...args),
      deleteMany: (...args: unknown[]) => mockDeleteMany(...args),
    },
    programAssignment: {
      update: (...args: unknown[]) => mockUpdate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

// Import after mocking
import {
  cleanupAssignmentSessions,
  deactivateAssignment,
  deleteAssignment,
} from '../cleanup-assignment'

// ============================================================
// Helpers
// ============================================================

const ASSIGNMENT_ID = 'assignment-1'

function today(): Date {
  return new Date('2026-03-15T00:00:00.000Z')
}

// ============================================================
// Tests: cleanupAssignmentSessions
// ============================================================

describe('cleanupAssignmentSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCount.mockResolvedValue(0)
    mockDeleteMany.mockResolvedValue({ count: 0 })
  })

  it('deletes future NOT_STARTED sessions and returns counts', async () => {
    mockCount.mockResolvedValue(2) // 2 preserved (completed)
    mockDeleteMany.mockResolvedValue({ count: 5 }) // 5 deleted

    const result = await cleanupAssignmentSessions(ASSIGNMENT_ID, today())

    expect(result).toEqual({ deleted: 5, preserved: 2 })
  })

  it('queries with correct programAssignmentId and date cutoff', async () => {
    await cleanupAssignmentSessions(ASSIGNMENT_ID, today())

    const cutoff = new Date('2026-03-15T00:00:00.000Z')

    // Verify the count query for preserved sessions
    expect(mockCount).toHaveBeenCalledWith({
      where: {
        programAssignmentId: ASSIGNMENT_ID,
        date: { gte: cutoff },
        status: { in: ['PARTIALLY_COMPLETED', 'FULLY_COMPLETED'] },
      },
    })

    // Verify the deleteMany query
    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: {
        programAssignmentId: ASSIGNMENT_ID,
        date: { gte: cutoff },
        status: 'NOT_STARTED',
      },
    })
  })

  it('returns zeros when no future sessions exist', async () => {
    mockCount.mockResolvedValue(0)
    mockDeleteMany.mockResolvedValue({ count: 0 })

    const result = await cleanupAssignmentSessions(ASSIGNMENT_ID, today())

    expect(result).toEqual({ deleted: 0, preserved: 0 })
  })

  it('only counts PARTIALLY_COMPLETED and FULLY_COMPLETED as preserved', async () => {
    mockCount.mockResolvedValue(3)
    mockDeleteMany.mockResolvedValue({ count: 10 })

    const result = await cleanupAssignmentSessions(ASSIGNMENT_ID, today())

    expect(result.preserved).toBe(3)
    expect(result.deleted).toBe(10)

    // Verify preserved query only checks completed statuses
    expect(mockCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ['PARTIALLY_COMPLETED', 'FULLY_COMPLETED'] },
        }),
      })
    )
  })

  it('normalizes date to start of day UTC', async () => {
    const midday = new Date('2026-03-15T14:30:00.000Z')
    await cleanupAssignmentSessions(ASSIGNMENT_ID, midday)

    const expectedCutoff = new Date('2026-03-15T00:00:00.000Z')

    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: {
        programAssignmentId: ASSIGNMENT_ID,
        date: { gte: expectedCutoff },
        status: 'NOT_STARTED',
      },
    })
  })
})

// ============================================================
// Tests: deactivateAssignment
// ============================================================

describe('deactivateAssignment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCount.mockResolvedValue(0)
    mockTransaction.mockResolvedValue([
      {
        id: ASSIGNMENT_ID,
        isActive: false,
        athlete: { id: 'athlete-1', name: 'Matt' },
        program: { id: 'program-1', name: 'Peaking Block' },
      },
      { count: 3 },
    ])
  })

  it('deactivates assignment and deletes future sessions in a transaction', async () => {
    mockCount.mockResolvedValue(1)

    const result = await deactivateAssignment(ASSIGNMENT_ID, today())

    expect(result.assignment.isActive).toBe(false)
    expect(result.cleanup.deleted).toBe(3)
    expect(result.cleanup.preserved).toBe(1)
  })

  it('calls $transaction with update and deleteMany', async () => {
    await deactivateAssignment(ASSIGNMENT_ID, today())

    expect(mockTransaction).toHaveBeenCalledOnce()
    const txArg = mockTransaction.mock.calls[0][0]
    expect(txArg).toHaveLength(2)
  })

  it('includes update with isActive=false in transaction', async () => {
    await deactivateAssignment(ASSIGNMENT_ID, today())

    // Verify the update mock was called with isActive: false
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ASSIGNMENT_ID },
        data: { isActive: false },
      })
    )
  })
})

// ============================================================
// Tests: deleteAssignment
// ============================================================

describe('deleteAssignment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCount.mockResolvedValue(0)
    mockTransaction.mockResolvedValue([
      { count: 5 }, // deleteMany result
      undefined,    // delete result
    ])
  })

  it('deletes future sessions then deletes the assignment', async () => {
    mockCount.mockResolvedValue(2)

    const result = await deleteAssignment(ASSIGNMENT_ID, today())

    expect(result.deleted).toBe(5)
    expect(result.preserved).toBe(2)
  })

  it('calls $transaction with deleteMany and delete', async () => {
    await deleteAssignment(ASSIGNMENT_ID, today())

    expect(mockTransaction).toHaveBeenCalledOnce()
    const txArg = mockTransaction.mock.calls[0][0]
    expect(txArg).toHaveLength(2)
  })

  it('returns zeros when no future sessions to clean up', async () => {
    mockTransaction.mockResolvedValue([
      { count: 0 },
      undefined,
    ])

    const result = await deleteAssignment(ASSIGNMENT_ID, today())

    expect(result.deleted).toBe(0)
    expect(result.preserved).toBe(0)
  })
})
