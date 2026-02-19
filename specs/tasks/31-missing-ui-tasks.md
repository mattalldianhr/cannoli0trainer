# Task Group 31: Missing UI Features

Source: specs/tasks/00-implied-features-audit.md (gaps #13, #14, #15, #25, #26)

### Priority 31: Missing UI Features

- [x] **Task 31.1**: Build workout history list component for coach athlete view
  - Spec: specs/03-athlete-management.md
  - Acceptance: `/athletes/[id]` profile page includes a "Training History" section showing a paginated list of `WorkoutSession` records for the athlete. Each row shows: date, workout/program name, completion percentage, total volume (sum of weight * reps across all SetLogs), duration. Most recent sessions first. Load 20 per page with a "Load More" button. Clicking a session row expands or navigates to the session detail view (Task 31.2).

- [x] **Task 31.2**: Build workout session detail view with prescribed vs actual comparison
  - Spec: specs/03-athlete-management.md
  - Acceptance: Session detail view (expandable row or `/athletes/[id]/sessions/[sessionId]` page) shows each exercise in the workout with two columns: "Prescribed" (from WorkoutExercise: sets x reps @ weight/RPE) and "Actual" (from SetLogs: logged sets with actual weight, reps, RPE). Visual indicators: green when actual meets or exceeds prescribed, yellow for partial completion, red for missed exercises. Total volume comparison at the bottom. Coach can see at a glance whether the athlete followed the program.

- [x] **Task 31.3**: Add coach notes to completed workout sessions
  - Spec: specs/03-athlete-management.md
  - Acceptance: `WorkoutSession` model gets a `coachNotes String? @db.Text` field. Migration runs. The session detail view (Task 31.2) includes a text area for the coach to add/edit notes on any completed session. Notes are saved via a PATCH to `/api/workout-sessions/[id]`. Notes are visible to both coach and athlete (athlete sees them as read-only feedback in their history view).

- [x] **Task 31.4**: Enable program builder edit mode for existing programs
  - Spec: specs/04-program-builder.md
  - Acceptance: `/programs/[id]/edit` loads the existing program data into the program builder state (weeks, days, exercises, all prescription fields). The builder pre-populates all fields from the database. Save updates the existing program record (PUT) instead of creating a new one. The page title shows "Edit: {program name}" instead of "New Program". Navigation from the programs list includes an "Edit" button/link on each program card.

- [x] **Task 31.5**: Add edit-in-progress warning for programs with active assignments
  - Spec: specs/04-program-builder.md
  - Acceptance: When opening `/programs/[id]/edit` for a program that has active ProgramAssignments (athletes currently using it), a warning banner appears at the top: "This program is assigned to {N} athletes. Changes will affect future workouts but will not modify already-completed sessions." The warning includes a list of assigned athlete names. Editing is still allowed (not blocked), but the coach is informed of the impact.

- [x] **Task 31.6**: Add bodyweight logging entry point
  - Spec: specs/07-progress-analytics.md
  - Acceptance: Two entry points for bodyweight logging: (1) On the athlete profile page (`/athletes/[id]`), a "Log Bodyweight" button opens a quick-entry form (weight input + unit toggle + date, defaults to today). (2) In the athlete training log session summary (after completing a workout), an optional bodyweight field appears. Both create a `BodyweightLog` record via `POST /api/bodyweight`. Coach can also log bodyweight on behalf of an athlete from the athlete profile.

- [x] **Task 31.7**: Add pagination to exercise library, training history, and activity feed
  - Spec: specs/05-exercise-library.md
  - Acceptance: Exercise library (`/exercises`): loads 30 exercises per page with "Load More" button or infinite scroll. Server-side search with `LIMIT 30 OFFSET N` instead of loading all 948 exercises. Training history (Task 31.1): already paginated at 20 per page. Dashboard activity feed: limited to 20 most recent items with a "View All" link. Exercise picker in program builder: server-side search with `LIMIT 20` and debounced input (300ms). All paginated endpoints return `{ data: [], total: number, hasMore: boolean }`.

- [x] **Task 31.8**: Display superset grouping in the training log
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: Exercises with the same `supersetGroup` value are visually grouped together in the training log. Grouping is indicated by: a colored left border using the `supersetColor` field, a "Superset" label above the group, and reduced spacing between grouped exercises. Within a superset group, exercises are displayed in their `order` sequence. The athlete can log sets in any order (not forced to alternate), but the visual grouping makes the intended pairing clear. Non-superset exercises display normally with no border or label.
