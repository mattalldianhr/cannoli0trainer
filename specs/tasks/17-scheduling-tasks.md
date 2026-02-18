# Priority 17: Workout Scheduling & Calendar

### Priority 17: Workout Scheduling & Calendar

- [ ] **Task 17.1**: Add scheduling fields to ProgramAssignment and WorkoutSession in Prisma schema
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: ProgramAssignment gains `trainingDays` (Json, default `[1,2,4,5]`) and `isActive` (Boolean, default true). WorkoutSession gains `workoutId` (FK -> Workout, optional), `programAssignmentId` (FK -> ProgramAssignment, optional), `isManuallyScheduled` (Boolean, default false), `isSkipped` (Boolean, default false), `weekNumber` (Int?), `dayNumber` (Int?). Migration runs successfully. `npx prisma validate` passes.

- [ ] **Task 17.2**: Implement schedule generation service at `src/lib/scheduling/generate-schedule.ts`
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: Pure function `generateSchedule(workouts, startDate, trainingDays)` returns an array of `{ date, workoutId, weekNumber, dayNumber, title }` objects. Maps abstract Week/Day pairs to concrete calendar dates using training day config. Handles programs where days-per-week exceeds training days (spillover). Handles programs where days-per-week is less than training days (rest gaps). Unit tested with at least 5 test cases covering 3-day, 4-day, 5-day, and spillover scenarios.

- [ ] **Task 17.3**: Implement schedule persistence — create WorkoutSessions from generated schedule
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: `persistSchedule(athleteId, programId, programAssignmentId, schedule)` creates WorkoutSession records in a transaction. Links each session to the source Workout via `workoutId` and to the assignment via `programAssignmentId`. Idempotent — skips dates where a session already exists (upsert or catch unique constraint). Returns count of created/skipped sessions.

- [ ] **Task 17.4**: Integrate scheduling into program assignment API (`/api/programs/[id]/assign`)
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: POST to `/api/programs/[id]/assign` with `{ athleteId, startDate, trainingDays? }` creates ProgramAssignment AND generates WorkoutSessions. If `trainingDays` is omitted, defaults to `[1,2,4,5]`. Response includes count of generated sessions. Integration test: assign a 4-week/4-day program and verify 16 WorkoutSessions are created on correct dates.

- [ ] **Task 17.5**: Add conflict detection for overlapping program assignments
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: Before generating sessions, check for existing WorkoutSessions on the target dates for the athlete. If conflicts found, return them in the API response with `{ conflicts: [{ date, existingTitle, existingProgramName }] }`. Coach can choose to proceed (overwrite) or cancel. Integration test: assign two programs overlapping on the same dates, verify conflicts are returned.

- [ ] **Task 17.6**: Implement reassignment cleanup — delete future NOT_STARTED sessions on assignment removal
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: When a ProgramAssignment is deleted (or `isActive` set to false), delete all WorkoutSessions where `programAssignmentId` matches AND `status = NOT_STARTED` AND `date >= today`. Preserve sessions with status `PARTIALLY_COMPLETED` or `FULLY_COMPLETED`. Unit test: create 16 sessions, mark 4 as completed, delete assignment, verify 12 deleted and 4 preserved.

- [ ] **Task 17.7**: Enhance `/api/train` to return `nextSession` when no workout exists for today
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: When no WorkoutSession exists for the requested date, the response includes `nextSession: { date, title, programName }` by querying the next WorkoutSession where `athleteId` matches, `date > requestedDate`, and `status = NOT_STARTED`. If no upcoming session exists, `nextSession` is null. Integration test: query `/api/train` for a rest day, verify `nextSession` points to the next scheduled workout.

- [ ] **Task 17.8**: Create coach calendar page at `/schedule` with weekly view
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: Page renders a 7-day week grid. Rows are athletes (filterable). Columns are Monday-Sunday. Each cell shows the WorkoutSession title for that athlete+date, or empty for rest/unscheduled days. Current week shown by default. Forward/backward navigation changes the displayed week. Data fetched via new API route `/api/schedule?week=2026-W08&athleteId=all`.

- [ ] **Task 17.9**: Create schedule API route at `/api/schedule`
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: GET `/api/schedule?startDate=2026-02-16&endDate=2026-02-22&athleteId=all` returns `{ athletes: [{ id, name, sessions: [{ date, title, status, workoutId, isSkipped }] }] }`. Supports filtering by athleteId (single or "all"). Supports date range query. Indexed query on WorkoutSession `[athleteId, date]` (index already exists).

- [ ] **Task 17.10**: Implement manual workout move (drag-drop or click-to-move) on calendar
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: Coach can move a workout from one date to another via the calendar UI. Moving updates the WorkoutSession's `date` field and sets `isManuallyScheduled = true`. If the target date already has a session, swap the two sessions' dates. API route: PUT `/api/schedule/move` with `{ sessionId, newDate }`. Conflict handling: if target date has a session for the same athlete, return both for swap confirmation.

- [ ] **Task 17.11**: Implement skip workout action on calendar
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: Coach can mark a workout as skipped from the calendar. Sets `isSkipped = true` on the WorkoutSession. Skipped sessions appear visually distinct (strikethrough or dimmed) in the calendar. API route: PUT `/api/schedule/skip` with `{ sessionId }`. Only NOT_STARTED sessions can be skipped.

- [ ] **Task 17.12**: Add training day selector to program assignment dialog
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: The "Assign to Athlete" flow (from Task 7.9) gains a training day configuration UI. Shows 7 day-of-week checkboxes (Sun-Sat) with Mon/Tue/Thu/Fri pre-checked. Coach can toggle days. Selected days are sent as `trainingDays` array in the assignment API call. Presets available: "4-Day (Mon/Tue/Thu/Fri)", "3-Day (Mon/Wed/Fri)", "5-Day (Mon-Fri)", "Custom".

- [ ] **Task 17.13**: Unit test scheduling service with edge cases
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: Tests cover: (1) standard 4-week/4-day program on Mon/Tue/Thu/Fri, (2) 3-day program on Mon/Wed/Fri, (3) 5-day program with only 4 training days (spillover), (4) program starting mid-week, (5) single-week program, (6) empty program (0 workouts), (7) 6-day program on 3 training days (heavy spillover), (8) training days including weekends. All tests pass with `npx vitest run`.

- [ ] **Task 17.14**: Integration test full assignment-to-train flow
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: End-to-end test: (1) create program with 2 weeks, 4 days each, (2) assign to athlete with startDate and training days, (3) verify 8 WorkoutSessions created, (4) call `/api/train` for the first scheduled date, (5) verify correct workout exercises returned. Test runs against seeded database.
