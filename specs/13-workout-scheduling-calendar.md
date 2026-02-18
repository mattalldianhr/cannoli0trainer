# Spec: Workout Scheduling & Calendar

## Job to Be Done
Bridge the gap between program design and athlete training by automatically generating WorkoutSession records when a coach assigns a program. Currently, programs define workouts as abstract Week/Day pairs (weekNumber, dayNumber) and ProgramAssignment links a program to an athlete, but there is no mechanism to map "Week 1 Day 1" to an actual calendar date. The `/train` page already resolves workouts correctly when a WorkoutSession exists for the athlete+date, but WorkoutSessions are only created during TeamBuildr data import — never from program assignment. This means newly assigned programs produce "No workout scheduled" for every date. The scheduling service closes this gap so coaches can assign a program and athletes immediately see their workouts on the correct days.

## Problem Statement

### Current Data Flow (Broken)
1. Coach creates Program with Workouts (weekNumber=1, dayNumber=1, etc.)
2. Coach assigns Program to Athlete via ProgramAssignment (with optional startDate/endDate)
3. Athlete opens `/train` for today's date
4. `/api/train` looks for `WorkoutSession` where `athleteId + date = today`
5. No WorkoutSession exists (never created) -> "No workout scheduled"

### Required Data Flow (Fixed)
1. Coach creates Program with Workouts (weekNumber=1, dayNumber=1, etc.)
2. Coach assigns Program to Athlete via ProgramAssignment with startDate and **trainingDays** config
3. **Scheduling service generates WorkoutSession records** mapping each Workout to a calendar date
4. Athlete opens `/train` for today's date
5. `/api/train` finds WorkoutSession -> workout loads correctly

## Requirements

### Scheduling Service
- When a coach assigns a program with a startDate, the system auto-generates WorkoutSession records for every workout day in the program
- The service maps abstract Workout days (weekNumber, dayNumber) to concrete calendar dates using the athlete's training day configuration
- Session generation is idempotent: re-running for the same assignment does not create duplicates (enforced by existing `@@unique([athleteId, date])` constraint)
- Each generated WorkoutSession links to the source Program and references the Workout title
- The service runs synchronously during assignment creation (programs are small enough — max ~24 workouts for a 6-week, 4-day program)

### Training Day Configuration
- Each ProgramAssignment has a `trainingDays` field specifying which days of the week are training days
- Default: `[1, 2, 4, 5]` (Monday, Tuesday, Thursday, Friday) — matches the most common 4-day powerlifting split
- Supports 3-day (e.g., Mon/Wed/Fri = `[1, 3, 5]`), 4-day, 5-day, and 6-day configurations
- Day numbering: 0 = Sunday, 1 = Monday, ..., 6 = Saturday (JavaScript convention)
- If a program has 4 training days per week and the athlete trains Mon/Tue/Thu/Fri, then:
  - Week 1 Day 1 -> Monday of week 1
  - Week 1 Day 2 -> Tuesday of week 1
  - Week 1 Day 3 -> Thursday of week 1
  - Week 1 Day 4 -> Friday of week 1
  - Week 2 Day 1 -> Monday of week 2 (and so on)
- If a program week has fewer days than trainingDays, unused days become rest days
- If a program week has more days than trainingDays, extra days spill into the next calendar week

### Calendar View (Coach)
- New page at `/schedule` showing a week-view calendar for the coach
- Rows = athletes (or filterable by athlete), columns = days of the week
- Each cell shows the scheduled workout name or "Rest" for empty days
- Coach can filter by: individual athlete, group/all athletes, date range
- Click a cell to view workout details or navigate to the workout in the program builder
- Current week shown by default with forward/backward navigation

### Manual Overrides
- Coach can drag-and-drop a workout to a different date (moves the WorkoutSession)
- Coach can swap two workout days (exchanges their dates)
- Coach can skip a workout day (deletes the WorkoutSession, marks as skipped)
- Coach can insert a rest day (shifts subsequent sessions forward by one training day)
- All overrides modify WorkoutSession records only — the Program's Workout structure remains unchanged
- Override history tracked via an `isManuallyScheduled` flag on WorkoutSession

### Program Reassignment
- When a program assignment is deleted or replaced, the system deletes all future (unstarted) WorkoutSessions for that assignment
- WorkoutSessions with status IN_PROGRESS or FULLY_COMPLETED are preserved (athlete's logged work is never deleted)
- When a new program is assigned, new sessions are generated starting from the assignment's startDate
- If the athlete already has a session on a date from another program, the conflict is flagged to the coach for resolution (not silently overwritten)

### Rest Day Logic
- Days not in `trainingDays` are implicit rest days (no WorkoutSession generated)
- Explicit rest days within a program (a week with fewer days than the training day count) leave gaps in the schedule
- The `/train` page shows "Rest Day" when no WorkoutSession exists for today, with a link to the next scheduled workout
- The calendar view shows rest days as empty cells (visually distinct from skipped workouts)

### `/train` Integration
- No changes needed to the existing `/api/train` route — it already queries WorkoutSession by `athleteId + date` and returns the linked workout
- The only fix needed: the scheduling service must populate WorkoutSession records so `/train` finds them
- Enhancement: when no session exists for today, the response includes `nextSession` (the next scheduled WorkoutSession date and title) so the UI can show "Next workout: Thursday — Heavy Squat Day"

## Schema Changes

### ProgramAssignment (modified)
Add fields to the existing ProgramAssignment model:
- `trainingDays` (Json, default `[1,2,4,5]`) — array of day-of-week integers
- `isActive` (Boolean, default true) — allows soft-deactivation without deleting

### WorkoutSession (modified)
Add fields to the existing WorkoutSession model:
- `workoutId` (String?, FK -> Workout) — links session to the specific Workout record it was generated from
- `programAssignmentId` (String?, FK -> ProgramAssignment) — tracks which assignment generated this session
- `isManuallyScheduled` (Boolean, default false) — true if coach manually moved/created this session
- `isSkipped` (Boolean, default false) — true if coach explicitly skipped this day
- `weekNumber` (Int?) — which program week this session belongs to
- `dayNumber` (Int?) — which program day this session belongs to

### Indexes
- WorkoutSession: add index on `[programAssignmentId]` for cleanup queries
- WorkoutSession: add index on `[workoutId]` for workout lookups

## Acceptance Criteria
- [ ] Assigning a program with startDate generates WorkoutSession records for all program days
- [ ] Training days default to Mon/Tue/Thu/Fri but can be configured per assignment
- [ ] Generated sessions correctly map Week 1 Day 1 to the first training day of the start week
- [ ] `/train` returns the correct workout for a date that has a generated session
- [ ] `/train` returns `nextSession` info when no workout is scheduled for today
- [ ] Coach calendar at `/schedule` shows weekly view with workout names per athlete
- [ ] Coach can drag a workout to a different date on the calendar
- [ ] Coach can skip a workout day from the calendar
- [ ] Deleting a program assignment removes only future NOT_STARTED sessions
- [ ] IN_PROGRESS and FULLY_COMPLETED sessions are preserved on reassignment
- [ ] Conflicting dates (two programs on same day) are flagged to the coach
- [ ] DEALBREAKER TEST: Assign a 4-week, 4-day/week program starting next Monday with Mon/Tue/Thu/Fri training days. Verify 16 WorkoutSessions are created on the correct dates. Open `/train` on that Monday and see the Week 1 Day 1 workout.

## Test Cases
| Input | Expected Output |
|-------|-----------------|
| Assign 4-week program, start Mon, training days Mon/Tue/Thu/Fri | 16 WorkoutSessions created on correct dates |
| Assign 3-week program, start Wed, training days Mon/Wed/Fri | Week 1 starts Wed (Day 1) and Fri (Day 2), Week 2 starts Mon (Day 3) |
| Assign program, then delete assignment | Future NOT_STARTED sessions deleted, completed ones kept |
| Assign two programs overlapping on same date | Conflict flagged to coach |
| Coach drags Thursday workout to Saturday | WorkoutSession date changes, isManuallyScheduled = true |
| Coach skips a workout | WorkoutSession.isSkipped = true, status unchanged |
| Athlete opens /train with no session today | "Rest Day" shown with "Next: Thursday — Heavy Squat Day" |
| Assign 5-day program with 4 training days | Day 5 spills to next week's first training day |
| Re-assign same program (re-run scheduling) | No duplicates (idempotent via unique constraint) |

## Technical Notes
- Scheduling service should be a pure function: `generateSchedule(program, assignment, trainingDays) -> WorkoutSession[]` — easy to unit test
- Use a transaction for session creation to ensure atomicity (all or nothing)
- The `/schedule` calendar page is a client component (heavy interactivity: drag-drop, navigation)
- Consider `@dnd-kit/core` for drag-and-drop (already common in Next.js projects) or simple click-to-move for v1
- For v1, the calendar can be coach-only. Athlete calendar (spec 10) reuses the same data but in a read-only view
- The scheduling service should be in `src/lib/scheduling/` with separate files for generation logic, conflict detection, and override handling
- Training day configuration UI can be a simple multi-select of weekdays (7 checkboxes) in the assignment dialog
- Performance: even for 50 athletes x 24 workouts = 1,200 sessions, this is well within a single DB transaction
