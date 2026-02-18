/**
 * Schedule generation service for mapping abstract program workouts
 * (weekNumber/dayNumber) to concrete calendar dates.
 *
 * Pure function: takes workouts + config, returns an array of scheduled items.
 * No database access — persistence is handled separately.
 */

export interface WorkoutInput {
  id: string
  weekNumber: number
  dayNumber: number
  name: string
}

export interface ScheduledSession {
  date: Date
  workoutId: string
  weekNumber: number
  dayNumber: number
  title: string
}

/**
 * Generate a schedule mapping abstract Week/Day workout pairs to calendar dates.
 *
 * Algorithm:
 * 1. Sort workouts by (weekNumber, dayNumber)
 * 2. Starting from startDate, find the first training day on or after startDate
 * 3. Assign each workout to the next available training day
 * 4. When training days for the current calendar week are exhausted,
 *    advance to the next calendar week's first training day
 *
 * Training days use JS convention: 0=Sunday, 1=Monday, ..., 6=Saturday.
 * Default: [1,2,4,5] (Mon/Tue/Thu/Fri).
 *
 * Spillover: If a program week has more days than available training days,
 * extra days spill into the next calendar week's training days.
 *
 * @param workouts - Array of workouts with weekNumber and dayNumber
 * @param startDate - The date the program begins
 * @param trainingDays - Array of day-of-week integers (0-6). Must be sorted.
 * @returns Array of scheduled sessions with concrete dates
 */
export function generateSchedule(
  workouts: WorkoutInput[],
  startDate: Date,
  trainingDays: number[] = [1, 2, 4, 5]
): ScheduledSession[] {
  if (workouts.length === 0 || trainingDays.length === 0) {
    return []
  }

  // Sort training days by offset from Monday (Mon=1 -> offset 0, Sun=0 -> offset 6)
  const sortedTrainingDays = [...trainingDays].sort((a, b) => {
    const offsetA = a === 0 ? 6 : a - 1
    const offsetB = b === 0 ? 6 : b - 1
    return offsetA - offsetB
  })

  // Sort workouts by week then day
  const sortedWorkouts = [...workouts].sort((a, b) => {
    if (a.weekNumber !== b.weekNumber) return a.weekNumber - b.weekNumber
    return a.dayNumber - b.dayNumber
  })

  // Group workouts by program week
  const weekGroups = new Map<number, WorkoutInput[]>()
  for (const workout of sortedWorkouts) {
    const group = weekGroups.get(workout.weekNumber) ?? []
    group.push(workout)
    weekGroups.set(workout.weekNumber, group)
  }

  const programWeeks = [...weekGroups.keys()].sort((a, b) => a - b)
  const sessions: ScheduledSession[] = []

  // Find the Monday of the week containing startDate (or the week start)
  let currentWeekStart = getWeekStart(startDate)

  // For the first week, we need to find training days on or after startDate
  let isFirstWeek = true

  for (const programWeek of programWeeks) {
    const weekWorkouts = weekGroups.get(programWeek)!
    let workoutIndex = 0

    while (workoutIndex < weekWorkouts.length) {
      // Get available training days for the current calendar week
      const availableDays = getTrainingDatesForWeek(
        currentWeekStart,
        sortedTrainingDays
      )

      // For the first week, filter to dates on or after startDate
      const eligibleDays = isFirstWeek
        ? availableDays.filter((d) => d >= startDate)
        : availableDays

      isFirstWeek = false

      // Assign workouts to available days
      for (const date of eligibleDays) {
        if (workoutIndex >= weekWorkouts.length) break

        const workout = weekWorkouts[workoutIndex]
        sessions.push({
          date,
          workoutId: workout.id,
          weekNumber: workout.weekNumber,
          dayNumber: workout.dayNumber,
          title: workout.name,
        })
        workoutIndex++
      }

      // If we still have workouts left for this program week, advance to next calendar week
      if (workoutIndex < weekWorkouts.length) {
        currentWeekStart = addDays(currentWeekStart, 7)
      }
    }

    // Advance to next calendar week for the next program week
    currentWeekStart = addDays(currentWeekStart, 7)
  }

  return sessions
}

/**
 * Get the Monday (start of week) for a given date.
 * If the date is Sunday (day 0), go back 6 days.
 * Otherwise, go back (day - 1) days.
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  return stripTime(d)
}

/**
 * Get concrete training dates for a given week starting from weekStart (Monday).
 */
function getTrainingDatesForWeek(
  weekStart: Date,
  trainingDays: number[]
): Date[] {
  return trainingDays.map((dayOfWeek) => {
    // Monday = 1, so offset from Monday is (dayOfWeek - 1)
    // Sunday = 0, offset from Monday is 6
    const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    return addDays(weekStart, offset)
  })
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return stripTime(d)
}

function stripTime(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}
