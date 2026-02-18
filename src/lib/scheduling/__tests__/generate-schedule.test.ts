/**
 * Unit tests for the schedule generation service.
 *
 * Task 17.2 acceptance criteria:
 * - generateSchedule() returns correct date mappings for 3-day, 4-day, 5-day programs
 * - Spillover: program weeks with more days than training days spill into next calendar week
 * - Mid-week start: starting on a Wednesday still assigns correctly
 * - Empty program returns empty schedule
 * - Weekend training days work (Sunday = 0)
 */

import { describe, it, expect } from 'vitest'
import {
  generateSchedule,
  type WorkoutInput,
} from '../generate-schedule'

// ============================================================
// Helpers
// ============================================================

function makeWorkout(
  weekNumber: number,
  dayNumber: number,
  name?: string
): WorkoutInput {
  return {
    id: `w${weekNumber}d${dayNumber}`,
    weekNumber,
    dayNumber,
    name: name ?? `Week ${weekNumber} Day ${dayNumber}`,
  }
}

function date(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day) // month is 0-indexed in JS
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ============================================================
// Standard 4-day program, Mon/Tue/Thu/Fri
// ============================================================

describe('generateSchedule', () => {
  describe('standard 4-day program with Mon/Tue/Thu/Fri', () => {
    // 4-week, 4-day/week program starting Monday Feb 23, 2026
    const workouts: WorkoutInput[] = []
    for (let week = 1; week <= 4; week++) {
      for (let day = 1; day <= 4; day++) {
        workouts.push(makeWorkout(week, day))
      }
    }

    const startDate = date(2026, 2, 23) // Monday Feb 23, 2026
    const trainingDays = [1, 2, 4, 5] // Mon/Tue/Thu/Fri

    it('should generate 16 sessions', () => {
      const sessions = generateSchedule(workouts, startDate, trainingDays)
      expect(sessions).toHaveLength(16)
    })

    it('should map Week 1 to the correct dates', () => {
      const sessions = generateSchedule(workouts, startDate, trainingDays)
      const week1 = sessions.filter((s) => s.weekNumber === 1)

      expect(week1).toHaveLength(4)
      expect(formatDate(week1[0].date)).toBe('2026-02-23') // Monday
      expect(formatDate(week1[1].date)).toBe('2026-02-24') // Tuesday
      expect(formatDate(week1[2].date)).toBe('2026-02-26') // Thursday
      expect(formatDate(week1[3].date)).toBe('2026-02-27') // Friday
    })

    it('should map Week 2 to the following calendar week', () => {
      const sessions = generateSchedule(workouts, startDate, trainingDays)
      const week2 = sessions.filter((s) => s.weekNumber === 2)

      expect(week2).toHaveLength(4)
      expect(formatDate(week2[0].date)).toBe('2026-03-02') // Monday
      expect(formatDate(week2[1].date)).toBe('2026-03-03') // Tuesday
      expect(formatDate(week2[2].date)).toBe('2026-03-05') // Thursday
      expect(formatDate(week2[3].date)).toBe('2026-03-06') // Friday
    })

    it('should preserve workout IDs and titles', () => {
      const sessions = generateSchedule(workouts, startDate, trainingDays)
      expect(sessions[0].workoutId).toBe('w1d1')
      expect(sessions[0].title).toBe('Week 1 Day 1')
      expect(sessions[0].weekNumber).toBe(1)
      expect(sessions[0].dayNumber).toBe(1)
    })
  })

  // ============================================================
  // 3-day program, Mon/Wed/Fri
  // ============================================================

  describe('3-day program with Mon/Wed/Fri', () => {
    const workouts = [
      makeWorkout(1, 1, 'Squat Day'),
      makeWorkout(1, 2, 'Bench Day'),
      makeWorkout(1, 3, 'Deadlift Day'),
      makeWorkout(2, 1, 'Squat Day'),
      makeWorkout(2, 2, 'Bench Day'),
      makeWorkout(2, 3, 'Deadlift Day'),
    ]

    it('should map 3 workouts per week to Mon/Wed/Fri', () => {
      const startDate = date(2026, 3, 2) // Monday March 2, 2026
      const trainingDays = [1, 3, 5] // Mon/Wed/Fri

      const sessions = generateSchedule(workouts, startDate, trainingDays)

      expect(sessions).toHaveLength(6)
      expect(formatDate(sessions[0].date)).toBe('2026-03-02') // Mon
      expect(formatDate(sessions[1].date)).toBe('2026-03-04') // Wed
      expect(formatDate(sessions[2].date)).toBe('2026-03-06') // Fri
      expect(formatDate(sessions[3].date)).toBe('2026-03-09') // Mon (week 2)
      expect(formatDate(sessions[4].date)).toBe('2026-03-11') // Wed
      expect(formatDate(sessions[5].date)).toBe('2026-03-13') // Fri
    })
  })

  // ============================================================
  // 5-day program with only 4 training days (spillover)
  // ============================================================

  describe('spillover: 5-day program week with 4 training days', () => {
    const workouts = [
      makeWorkout(1, 1, 'Heavy Squat'),
      makeWorkout(1, 2, 'Heavy Bench'),
      makeWorkout(1, 3, 'Deadlift'),
      makeWorkout(1, 4, 'Volume Bench'),
      makeWorkout(1, 5, 'Volume Squat'), // This spills to next week
    ]

    it('should spill day 5 to the next calendar week', () => {
      const startDate = date(2026, 2, 23) // Monday
      const trainingDays = [1, 2, 4, 5] // Mon/Tue/Thu/Fri (4 days)

      const sessions = generateSchedule(workouts, startDate, trainingDays)

      expect(sessions).toHaveLength(5)
      // First 4 days fit in week 1
      expect(formatDate(sessions[0].date)).toBe('2026-02-23') // Mon
      expect(formatDate(sessions[1].date)).toBe('2026-02-24') // Tue
      expect(formatDate(sessions[2].date)).toBe('2026-02-26') // Thu
      expect(formatDate(sessions[3].date)).toBe('2026-02-27') // Fri
      // Day 5 spills to next week's first training day
      expect(formatDate(sessions[4].date)).toBe('2026-03-02') // Next Monday
      expect(sessions[4].title).toBe('Volume Squat')
    })
  })

  // ============================================================
  // Mid-week start (Wednesday)
  // ============================================================

  describe('mid-week start on Wednesday', () => {
    const workouts = [
      makeWorkout(1, 1),
      makeWorkout(1, 2),
      makeWorkout(1, 3),
      makeWorkout(2, 1),
      makeWorkout(2, 2),
      makeWorkout(2, 3),
    ]

    it('should start from the first training day on or after start date', () => {
      const startDate = date(2026, 2, 25) // Wednesday Feb 25
      const trainingDays = [1, 3, 5] // Mon/Wed/Fri

      const sessions = generateSchedule(workouts, startDate, trainingDays)

      expect(sessions).toHaveLength(6)
      // Week 1: start Wed (Mon is before startDate, skip it)
      expect(formatDate(sessions[0].date)).toBe('2026-02-25') // Wed
      expect(formatDate(sessions[1].date)).toBe('2026-02-27') // Fri
      // Day 3 spills to next week (only 2 eligible days this week)
      expect(formatDate(sessions[2].date)).toBe('2026-03-02') // Next Mon
      // Week 2 starts on next available week
      expect(formatDate(sessions[3].date)).toBe('2026-03-09') // Mon
      expect(formatDate(sessions[4].date)).toBe('2026-03-11') // Wed
      expect(formatDate(sessions[5].date)).toBe('2026-03-13') // Fri
    })
  })

  // ============================================================
  // Edge cases
  // ============================================================

  describe('edge cases', () => {
    it('should return empty array for empty workouts', () => {
      const sessions = generateSchedule([], date(2026, 1, 1))
      expect(sessions).toHaveLength(0)
    })

    it('should return empty array for empty training days', () => {
      const workouts = [makeWorkout(1, 1)]
      const sessions = generateSchedule(workouts, date(2026, 1, 1), [])
      expect(sessions).toHaveLength(0)
    })

    it('should handle weekend training days (Sunday=0, Saturday=6)', () => {
      const workouts = [makeWorkout(1, 1), makeWorkout(1, 2)]
      const startDate = date(2026, 2, 23) // Monday
      const trainingDays = [6, 0] // Sat/Sun

      const sessions = generateSchedule(workouts, startDate, trainingDays)

      expect(sessions).toHaveLength(2)
      expect(formatDate(sessions[0].date)).toBe('2026-02-28') // Saturday
      expect(formatDate(sessions[1].date)).toBe('2026-03-01') // Sunday
    })

    it('should handle single training day per week', () => {
      const workouts = [
        makeWorkout(1, 1),
        makeWorkout(1, 2),
        makeWorkout(2, 1),
      ]
      const startDate = date(2026, 2, 23) // Monday
      const trainingDays = [3] // Wednesday only

      const sessions = generateSchedule(workouts, startDate, trainingDays)

      expect(sessions).toHaveLength(3)
      expect(formatDate(sessions[0].date)).toBe('2026-02-25') // Wed week 1
      expect(formatDate(sessions[1].date)).toBe('2026-03-04') // Wed week 2 (spillover)
      expect(formatDate(sessions[2].date)).toBe('2026-03-11') // Wed week 3
    })

    it('should handle workouts with fewer days than training days (rest gaps)', () => {
      // 2 workout days per week, but 4 training days available
      const workouts = [
        makeWorkout(1, 1),
        makeWorkout(1, 2),
        makeWorkout(2, 1),
        makeWorkout(2, 2),
      ]
      const startDate = date(2026, 2, 23) // Monday
      const trainingDays = [1, 2, 4, 5] // Mon/Tue/Thu/Fri

      const sessions = generateSchedule(workouts, startDate, trainingDays)

      expect(sessions).toHaveLength(4)
      // Week 1: only 2 workouts, so only Mon/Tue used, Thu/Fri are rest
      expect(formatDate(sessions[0].date)).toBe('2026-02-23') // Mon
      expect(formatDate(sessions[1].date)).toBe('2026-02-24') // Tue
      // Week 2: same pattern
      expect(formatDate(sessions[2].date)).toBe('2026-03-02') // Mon
      expect(formatDate(sessions[3].date)).toBe('2026-03-03') // Tue
    })

    it('should handle unsorted workout input', () => {
      const workouts = [
        makeWorkout(2, 1),
        makeWorkout(1, 3),
        makeWorkout(1, 1),
        makeWorkout(1, 2),
        makeWorkout(2, 2),
      ]
      const startDate = date(2026, 2, 23)
      const trainingDays = [1, 3, 5]

      const sessions = generateSchedule(workouts, startDate, trainingDays)

      expect(sessions).toHaveLength(5)
      expect(sessions[0].weekNumber).toBe(1)
      expect(sessions[0].dayNumber).toBe(1)
      expect(sessions[1].weekNumber).toBe(1)
      expect(sessions[1].dayNumber).toBe(2)
      expect(sessions[2].weekNumber).toBe(1)
      expect(sessions[2].dayNumber).toBe(3)
      expect(sessions[3].weekNumber).toBe(2)
      expect(sessions[3].dayNumber).toBe(1)
    })

    it('should handle unsorted training days input', () => {
      const workouts = [makeWorkout(1, 1), makeWorkout(1, 2)]
      const startDate = date(2026, 2, 23) // Monday
      const trainingDays = [5, 1] // Fri, Mon (unsorted)

      const sessions = generateSchedule(workouts, startDate, trainingDays)

      expect(sessions).toHaveLength(2)
      // Should sort training days: Mon first, then Fri
      expect(formatDate(sessions[0].date)).toBe('2026-02-23') // Mon
      expect(formatDate(sessions[1].date)).toBe('2026-02-27') // Fri
    })
  })

  // ============================================================
  // Dealbreaker test from spec
  // ============================================================

  describe('DEALBREAKER: 4-week 4-day program on Mon/Tue/Thu/Fri', () => {
    it('should create 16 sessions on the exact correct dates', () => {
      const workouts: WorkoutInput[] = []
      for (let w = 1; w <= 4; w++) {
        for (let d = 1; d <= 4; d++) {
          workouts.push(makeWorkout(w, d, `W${w}D${d}`))
        }
      }

      // Start Monday, March 2, 2026
      const startDate = date(2026, 3, 2)
      const trainingDays = [1, 2, 4, 5]

      const sessions = generateSchedule(workouts, startDate, trainingDays)

      expect(sessions).toHaveLength(16)

      // Verify all 16 dates
      const expectedDates = [
        // Week 1: Mar 2 (Mon), 3 (Tue), 5 (Thu), 6 (Fri)
        '2026-03-02', '2026-03-03', '2026-03-05', '2026-03-06',
        // Week 2: Mar 9, 10, 12, 13
        '2026-03-09', '2026-03-10', '2026-03-12', '2026-03-13',
        // Week 3: Mar 16, 17, 19, 20
        '2026-03-16', '2026-03-17', '2026-03-19', '2026-03-20',
        // Week 4: Mar 23, 24, 26, 27
        '2026-03-23', '2026-03-24', '2026-03-26', '2026-03-27',
      ]

      sessions.forEach((session, i) => {
        expect(formatDate(session.date)).toBe(expectedDates[i])
      })

      // Verify workout mapping
      expect(sessions[0].title).toBe('W1D1')
      expect(sessions[0].workoutId).toBe('w1d1')
      expect(sessions[15].title).toBe('W4D4')
      expect(sessions[15].workoutId).toBe('w4d4')
    })
  })
})
