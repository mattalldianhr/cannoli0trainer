# Implementation Plan

## Status
- Total tasks: 179
- Completed: 79
- In progress: 0
- Remaining: 100 (7 original + 97 new from spec review)

## Tasks

### Priority 1: Foundation (Data Layer)

- [x] **Task 1.1**: Define Prisma enums for ExperienceLevel, PrescriptionType, WeightUnit, ProgramType, PeriodizationType
  - Spec: specs/01-data-models-and-schema.md
  - Acceptance: `npx prisma validate` passes with all enums defined

- [x] **Task 1.2**: Create Coach model in Prisma schema with id, name, email, brandName, timestamps
  - Spec: specs/01-data-models-and-schema.md
  - Acceptance: `npx prisma validate` passes, Coach model present

- [x] **Task 1.3**: Create Athlete model with all profile fields and FK to Coach
  - Spec: specs/01-data-models-and-schema.md
  - Acceptance: `npx prisma validate` passes, Athlete has coachId relation

- [x] **Task 1.4**: Create Program, ProgramAssignment, Workout, Exercise, WorkoutExercise models
  - Spec: specs/01-data-models-and-schema.md
  - Acceptance: `npx prisma validate` passes, all programming models defined with relations

- [x] **Task 1.5**: Create SetLog model with all tracking fields (reps, weight, RPE, RIR, velocity)
  - Spec: specs/01-data-models-and-schema.md
  - Acceptance: `npx prisma validate` passes, SetLog supports all 6 prescription methods

- [x] **Task 1.6**: Create BodyweightLog, CompetitionMeet, and MeetEntry models
  - Spec: specs/01-data-models-and-schema.md
  - Acceptance: `npx prisma validate` passes, meet models have proper relations

- [x] **Task 1.7**: Add database indexes on coachId, athleteId, programId, workoutId foreign keys
  - Spec: specs/01-data-models-and-schema.md
  - Acceptance: `npx prisma validate` passes, indexes defined on FK columns

- [x] **Task 1.8**: Run Prisma migration to create all tables
  - Spec: specs/01-data-models-and-schema.md
  - Acceptance: `npx prisma migrate dev --name init-platform-models` succeeds

- [x] **Task 1.9**: Add WorkoutSession and MaxSnapshot models to Prisma schema
  - Spec: specs/01-data-models-and-schema.md
  - Acceptance: `npx prisma validate` passes, both models have proper relations and indexes
  - Note: Moved from old Priority 13 (Task 13.1). Required before data seeding.

- [x] **Task 1.10**: Add superset, unilateral, rest, tempo fields to WorkoutExercise model
  - Spec: specs/01-data-models-and-schema.md
  - Acceptance: `npx prisma validate` passes, WorkoutExercise has supersetGroup, supersetColor, isUnilateral, restTimeSeconds, tempo fields
  - Note: Moved from old Priority 13 (Task 13.2). Required before TeamBuildr import.

### Priority 2: Data Seeding (Real Data)

- [x] **Task 2.1**: Download and import free-exercise-db (800+ exercises) into seed script
  - Spec: specs/05-exercise-library.md, summaries/open-source-exercise-databases-apis-powerlifting-resources.md
  - Acceptance: `npx prisma db seed` creates 800+ exercises with name, category, force, level, mechanic, equipment, primaryMuscles, secondaryMuscles, instructions, images
  - Data source: https://github.com/yuhonas/free-exercise-db (Unlicense/Public Domain)

- [x] **Task 2.2**: Tag powerlifting-relevant exercises and create exercise name mapping
  - Spec: specs/05-exercise-library.md
  - Acceptance: Exercises tagged with powerlifting categories (competition_lift, competition_variation, accessory, gpp). TeamBuildr's 136 exercise names mapped to free-exercise-db entries where possible, unmatched exercises created as new entries.
  - Data source: TeamBuildr export (136 unique exercises) + free-exercise-db

- [x] **Task 2.3**: Build TeamBuildr data transformer (TeamBuildr schema -> Cannoli schema)
  - Spec: summaries/teambuildr-api-exploration-findings.md
  - Acceptance: Transforms all exercise types (L, S, C, N, W), handles prescribed (placeholder) vs actual (value) pattern, maps superset grouping (groupingLetter/groupingColorCode), extracts RPE from additionalInformation, maps workingMax/generatedMax to MaxSnapshot
  - Note: Moved from old Priority 13 (Task 13.4). Must run before import.

- [x] **Task 2.4**: Create TeamBuildr import seed script for coach + athletes
  - Spec: summaries/teambuildr-api-exploration-findings.md
  - Acceptance: `npx prisma db seed` creates coach (Joe Cristando), 5 athletes with real profiles (Matt, Chris, Michael, Hannah, Maddy), group assignments, correct IDs and date ranges from TeamBuildr export
  - Data source: test-data/teambuildr-full-export-5-athletes.json

- [x] **Task 2.5**: Import workout history (sessions, exercises, sets, maxes) from TeamBuildr export
  - Spec: summaries/teambuildr-api-exploration-findings.md
  - Acceptance: All 2,033 workout dates imported as WorkoutSessions. All 12,437 workout items imported as WorkoutExercises with SetLogs. All 1,806 PRs imported as MaxSnapshots. Tonnage, sets, reps match source data totals.
  - Data source: test-data/teambuildr-full-export-5-athletes.json

- [x] **Task 2.6**: Create import validation script to verify data completeness
  - Spec: summaries/spec-review-teambuildr-data-alignment.md
  - Acceptance: Script compares source TeamBuildr JSON counts (dates, exercises, sets, reps, tonnage, PRs per athlete) against imported database records, reports discrepancies with pass/fail status
  - Note: Moved from old Priority 13 (Task 13.5).

- [x] **Task 2.7**: Install `@finegym/fitness-calc` and `powerlifting-formulas` npm packages
  - Spec: summaries/open-source-exercise-databases-apis-powerlifting-resources.md
  - Acceptance: Both packages installed, TypeScript types resolve. Test: `calculateOneRepMax(100, 5)` returns valid e1RM. `wilks(82.5, 510, 'male')` returns valid score.
  - Note: MIT-licensed calculation libraries for 1RM (Epley, Brzycki, etc.) and powerlifting coefficients (Wilks, DOTS).

- [x] **Task 2.8**: Implement RPE/RIR-to-%1RM lookup table as data module
  - Spec: specs/12-rpe-rir-support.md, summaries/open-source-exercise-databases-apis-powerlifting-resources.md
  - Acceptance: `src/lib/rpe-table.ts` exports lookup function: given RPE (6-10) and reps (1-12), returns %1RM. Covers ~50 data points from Tuchscherer RPE table. TypeScript typed, unit tested.

### Priority 3: Testing Infrastructure & Data Validation

- [x] **Task 3.1**: Install Vitest and configure for Next.js + Prisma project
  - Spec: (none — infrastructure)
  - Acceptance: `npx vitest run` executes with zero tests. `vitest.config.ts` configures path aliases (`@/*`), TypeScript, and test file patterns. `package.json` has `"test": "vitest run"` script. AGENTS.md updated with test command.

- [x] **Task 3.2**: Unit test TeamBuildr data transformer against known export data
  - Spec: summaries/teambuildr-api-exploration-findings.md
  - Acceptance: Tests verify: prescribed (placeholder) vs actual (value) extraction, superset grouping mapping, exercise type code mapping (L→Lift, S→SAQ+C, etc.), workingMax/generatedMax→MaxSnapshot conversion, RPE extraction from additionalInformation. Uses real sample data from export.

- [x] **Task 3.3**: Unit test 1RM calculation library and RPE/RIR lookup table
  - Spec: specs/12-rpe-rir-support.md, summaries/open-source-exercise-databases-apis-powerlifting-resources.md
  - Acceptance: Tests verify: `calculateOneRepMax(140, 5)` returns expected value for each formula (Epley, Brzycki). RPE table returns correct %1RM for known inputs (RPE 10 @ 1 rep = 100%, RPE 8 @ 5 reps = 76%). Wilks/DOTS return expected scores for known bodyweight+total combos.

- [x] **Task 3.4**: Integration test seed script — verify import counts match source data
  - Spec: summaries/teambuildr-api-exploration-findings.md
  - Acceptance: Test seeds a test database, then asserts: 5 athletes, 2,033 WorkoutSessions, 12,437 WorkoutExercises, 16,552 SetLogs, 1,806 MaxSnapshots (PRs), 136+ exercises. Per-athlete tonnage matches source totals. Uses Prisma test client with isolated database or transaction rollback.

- [x] **Task 3.5**: Integration test API routes with seeded data (CRUD operations)
  - Spec: specs/02-coach-dashboard.md, specs/03-athlete-management.md
  - Acceptance: Tests hit API routes against seeded database: GET `/api/athletes` returns 5 athletes, GET `/api/athletes/[id]` returns correct profile, GET `/api/exercises` returns 800+ exercises with search filtering, POST/PUT/DELETE operations work and persist. Uses Next.js test server or direct route handler calls.

- [x] **Task 3.6**: Install Playwright and create E2E smoke tests for core pages
  - Spec: (none — infrastructure)
  - Acceptance: `npx playwright test` runs headless Chrome. Smoke tests verify: homepage loads, `/athletes` lists 5 athletes, `/exercises` shows exercise library with search, `/dashboard` displays stat cards with non-zero values, `/analytics` renders charts. All assertions against real seeded data.

### Priority 4: Core API Routes

- [x] **Task 4.1**: Create CRUD API routes for Coach (`/api/coaches`)
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: POST creates coach, GET returns coach profile

- [x] **Task 4.2**: Create CRUD API routes for Athletes (`/api/athletes`, `/api/athletes/[id]`)
  - Spec: specs/03-athlete-management.md
  - Acceptance: POST/GET/PUT/DELETE work, GET supports search query param

- [x] **Task 4.3**: Create CRUD API routes for Programs (`/api/programs`, `/api/programs/[id]`)
  - Spec: specs/04-program-builder.md
  - Acceptance: POST/GET/PUT/DELETE work, includes nested workout/exercise data

- [x] **Task 4.4**: Create CRUD API routes for Exercises (`/api/exercises`)
  - Spec: specs/05-exercise-library.md
  - Acceptance: POST/GET/PUT/DELETE work, GET supports search and category filter

- [x] **Task 4.5**: Create API routes for SetLog entries (`/api/sets`)
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: POST creates set log, GET returns sets for athlete+exercise

- [x] **Task 4.6**: Create API routes for BodyweightLog (`/api/bodyweight`)
  - Spec: specs/07-progress-analytics.md
  - Acceptance: POST creates log, GET returns history for athlete

- [x] **Task 4.7**: Create API routes for Meets (`/api/meets`, `/api/meets/[id]`)
  - Spec: specs/09-competition-prep.md
  - Acceptance: POST/GET/PUT work, includes meet entries with athlete data

- [x] **Task 4.8**: Create program assignment API (`/api/programs/[id]/assign`)
  - Spec: specs/04-program-builder.md
  - Acceptance: POST assigns program to athlete(s), creates ProgramAssignment records

- [x] **Task 4.9**: Create analytics data API (`/api/analytics/[athleteId]`)
  - Spec: specs/07-progress-analytics.md
  - Acceptance: GET returns aggregated data (1RM trends, volume, compliance) for date range

### Priority 5: Core UI - Athlete Management

- [x] **Task 5.1**: Create athlete listing page at `/athletes` with search and filter
  - Spec: specs/03-athlete-management.md
  - Acceptance: Page renders athlete list, search filters by name, filter chips work

- [x] **Task 5.2**: Create "Add Athlete" form with validation
  - Spec: specs/03-athlete-management.md
  - Acceptance: Form creates athlete via API, validates required fields

- [x] **Task 5.3**: Create athlete profile page at `/athletes/[id]` with tabs for info, training, analytics
  - Spec: specs/03-athlete-management.md
  - Acceptance: Profile shows athlete data, current program, recent training

- [x] **Task 5.4**: Add edit and delete functionality to athlete profile
  - Spec: specs/03-athlete-management.md
  - Acceptance: Edit saves changes, delete shows confirmation then removes

### Priority 6: Core UI - Exercise Library

- [x] **Task 6.1**: Create exercise library page at `/exercises` with search and category filter
  - Spec: specs/05-exercise-library.md
  - Acceptance: Page lists exercises, search and filter work

- [x] **Task 6.2**: Create "Add Exercise" form with name, category, video URL, cues, tags
  - Spec: specs/05-exercise-library.md
  - Acceptance: Form creates exercise, video URL renders embed preview

- [x] **Task 6.3**: Create reusable ExercisePicker component for program builder
  - Spec: specs/05-exercise-library.md
  - Acceptance: Modal/popover with search, selecting exercise returns exercise data

### Priority 7: Core UI - Program Builder

- [x] **Task 7.1**: Create program listing page at `/programs` showing programs and templates
  - Spec: specs/04-program-builder.md
  - Acceptance: Page lists programs with name, athlete count, duration, type

- [x] **Task 7.2**: Create program builder types in `lib/programs/types.ts`
  - Spec: specs/04-program-builder.md
  - Acceptance: TypeScript interfaces for program editing state compile without errors

- [x] **Task 7.3**: Create program builder page at `/programs/new` with week/day structure
  - Spec: specs/04-program-builder.md
  - Acceptance: Can create program, add weeks, add days within weeks

- [x] **Task 7.4**: Add exercise addition to program builder with prescription type selector
  - Spec: specs/04-program-builder.md
  - Acceptance: Can add exercise from library, select prescription type, enter prescription values

- [x] **Task 7.5**: Implement prescription type conditional fields (RPE, %1RM, RIR, velocity, auto, fixed)
  - Spec: specs/04-program-builder.md, specs/12-rpe-rir-support.md
  - Acceptance: All 6 prescription types show correct input fields

- [x] **Task 7.6**: Add week/day/exercise duplication in program builder
  - Spec: specs/04-program-builder.md
  - Acceptance: Duplicate week copies all days/exercises, duplicate day copies exercises

- [x] **Task 7.7**: Add exercise reordering within a day
  - Spec: specs/04-program-builder.md
  - Acceptance: Move up/down buttons change exercise order

- [x] **Task 7.8**: Implement program save (create/update) to database via API
  - Spec: specs/04-program-builder.md
  - Acceptance: Saving program persists all weeks/days/exercises to database

- [x] **Task 7.9**: Add "Assign to Athlete" flow on program page
  - Spec: specs/04-program-builder.md
  - Acceptance: Select athletes from list, assign creates ProgramAssignment records

### Priority 8: Template System

- [x] **Task 8.1**: Add "Save as Template" button to program builder
  - Spec: specs/11-template-system.md
  - Acceptance: Creates template copy of program (isTemplate=true, no athlete loads)

- [x] **Task 8.2**: Create template listing page at `/programs/templates`
  - Spec: specs/11-template-system.md
  - Acceptance: Lists templates with metadata, search, and filter by periodization type

- [x] **Task 8.3**: Add "Create from Template" flow
  - Spec: specs/11-template-system.md
  - Acceptance: Creates new program from template structure without athlete-specific loads

### Priority 9: RPE/RIR Support Components

- [x] **Task 9.1**: Create RPESelector component with 1-10 scale (0.5 increments)
  - Spec: specs/12-rpe-rir-support.md
  - Acceptance: Component renders scale, supports selection, shows RPE descriptions

- [x] **Task 9.2**: Create RPE reference chart popover component
  - Spec: specs/12-rpe-rir-support.md
  - Acceptance: Info icon opens popover showing RPE 1-10 with descriptions

### Priority 10: Athlete Training Log

- [x] **Task 10.1**: Create training log page at `/train` showing today's workout
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: Displays assigned exercises with prescriptions, mobile-optimized

- [x] **Task 10.2**: Implement set logging interface with reps, weight, RPE, velocity inputs
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: Each set has input fields, completing set saves to database

- [x] **Task 10.3**: Add previous performance reference per exercise
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: Shows "Last: X lbs x Y reps" from most recent session

- [x] **Task 10.4**: Add workout completion summary card
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: After all exercises, shows total volume, sets, top RPE

### Priority 11: Coach Dashboard

- [x] **Task 11.1**: Create dashboard page at `/dashboard` with overview stat cards
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: Shows total athletes, active programs, workouts this week

- [x] **Task 11.2**: Add recent activity feed to dashboard
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: Shows last 7 days of athlete training logs grouped by day

- [x] **Task 11.3**: Add "Needs Attention" section flagging inactive athletes
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: Shows athletes with no logs in 3+ days

- [x] **Task 11.4**: Add upcoming meets section to dashboard
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: Shows meets in next 30 days with athlete count

- [x] **Task 11.5**: Update Header nav to include Dashboard, Athletes, Programs, Exercises links
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: Nav links route to correct pages, active state shown
  - Note: Current Header has research hub links (Home, Research, Interview, Submissions, Findings, PRD). Must replace or restructure for coaching platform nav.

### Priority 12: Progress Analytics

- [x] **Task 12.1**: Install charting library (recharts) and create base chart components
  - Spec: specs/07-progress-analytics.md
  - Acceptance: recharts installed, basic LineChart and BarChart wrappers created

- [x] **Task 12.2**: Create analytics page at `/analytics` with date range selector
  - Spec: specs/07-progress-analytics.md
  - Acceptance: Page renders with selectable date ranges (4/8/12 weeks, all time)

- [x] **Task 12.3**: Implement 1RM trend chart and volume tracking chart
  - Spec: specs/07-progress-analytics.md
  - Acceptance: Line chart shows estimated 1RM over time, bar chart shows weekly volume
  - Note: Already implemented in AnalyticsDashboard.tsx during Task 12.2 — E1RM uses MaxSnapshot + RPE-based fallback, volume uses weekly tonnage bar chart

- [x] **Task 12.4**: Implement compliance rate and bodyweight trend charts
  - Spec: specs/07-progress-analytics.md
  - Acceptance: Compliance shows %, bodyweight shows trend line
  - Note: Already implemented in AnalyticsDashboard.tsx during Task 12.2 — compliance bar chart + bodyweight line chart with empty states

- [x] **Task 12.5**: Add CSV export for athlete training data
  - Spec: specs/07-progress-analytics.md
  - Acceptance: Download button generates CSV with date, exercise, sets, reps, weight, RPE

### Priority 13: VBT Analytics

- [x] **Task 13.1**: Create load-velocity scatter chart component
  - Spec: specs/08-vbt-integration.md
  - Acceptance: Scatter plot of (weight, velocity) with linear regression trend line

- [x] **Task 13.2**: Create velocity profile table and preparedness indicator
  - Spec: specs/08-vbt-integration.md
  - Acceptance: Table shows avg velocity at different %1RM, indicator compares to baseline

- [x] **Task 13.3**: Add VBT section to analytics page
  - Spec: specs/08-vbt-integration.md
  - Acceptance: VBT charts render when velocity data exists, empty state otherwise

### Priority 14: Competition Prep

- [x] **Task 14.1**: Create meet listing and creation pages at `/meets`
  - Spec: specs/09-competition-prep.md
  - Acceptance: List meets, create new meet with name/date/location/federation

- [x] **Task 14.2**: Create meet detail page with athlete entries and attempt planning
  - Spec: specs/09-competition-prep.md
  - Acceptance: Add athletes, set planned attempts for SBD

- [x] **Task 14.3**: Build warm-up timing calculator and countdown timer
  - Spec: specs/09-competition-prep.md
  - Acceptance: Input flight start time, generates warm-up schedule with countdown

- [x] **Task 14.4**: Create multi-athlete flight tracking view
  - Spec: specs/09-competition-prep.md
  - Acceptance: Grid shows all athletes' warm-up progress in a single view

### Priority 15: Production Export (COMPLETED)

- [x] **Task 15.1**: Create production TeamBuildr export script with rate limiting and resume
  - Spec: summaries/teambuildr-api-exploration-findings.md
  - Acceptance: `npx tsx scripts/teambuildr-export.ts --help` prints usage, supports --token, --account, --output, --resume flags
  - **Completed**: Full implementation exists at `scripts/teambuildr-export.ts` with supporting libraries in `scripts/lib/` (teambuildr-client, rate-limiter, retry, checkpoint, logger). Supports --token, --account, --output, --resume, --athletes, --concurrency, --rate flags.

### Priority 16: Railway Deployment & Live Testing

- [ ] **Task 16.1**: Configure Railway PostgreSQL plugin and environment variables
  - Spec: (none — infrastructure)
  - Acceptance: Railway project has PostgreSQL plugin provisioned. `DATABASE_URL`, `DIRECT_URL` (if needed) environment variables set in Railway dashboard. `.env.example` documents all required env vars. Railway build succeeds with `npx prisma generate` in build step.

- [ ] **Task 16.2**: Run Prisma migrations on Railway production database
  - Spec: specs/01-data-models-and-schema.md
  - Acceptance: `railway run npx prisma migrate deploy` succeeds. All tables created in production database. `railway run npx prisma db seed` populates production with real data (5 athletes, 800+ exercises, 2,033 sessions).

- [ ] **Task 16.3**: Verify production deployment at cannoli.mattalldian.com
  - Spec: (none — infrastructure)
  - Acceptance: `railway up` or `git push` triggers successful deploy. All pages return 200: `/dashboard`, `/athletes`, `/exercises`, `/programs`, `/analytics`, `/findings`. No build errors, no runtime errors in Railway logs.

- [ ] **Task 16.4**: Production smoke test — verify real data renders on live site
  - Spec: specs/02-coach-dashboard.md, specs/03-athlete-management.md
  - Acceptance: Dashboard shows non-zero stats (5 athletes, active programs). `/athletes` lists all 5 athletes with correct names. `/exercises` shows 800+ exercises with working search. At least one athlete profile page loads with training history and PR data.

- [ ] **Task 16.5**: Run Playwright E2E tests against production URL
  - Spec: (none — infrastructure)
  - Acceptance: `PLAYWRIGHT_BASE_URL=https://cannoli.mattalldian.com npx playwright test` passes all smoke tests from Task 3.6 against live production. Tests verify real data (not mocked) renders correctly. Any failures documented and triaged.

- [ ] **Task 16.6**: Configure Railway health check and auto-deploy from main branch
  - Spec: (none — infrastructure)
  - Acceptance: Railway health check endpoint (`/api/health`) returns 200 with `{ status: "ok", db: "connected" }`. Railway auto-deploys on push to `main`. Failed deploys do not replace the running version (Railway's default rollback behavior confirmed).

## Discoveries

_Updated by Ralph during planning review (2026-02-17)_

### Workout History Import (2026-02-18)
Full workout history imported via `seedWorkoutHistory()` in `prisma/seed.ts`. Creates one "TeamBuildr Import" Program per athlete as a container, with Workout records for each session date. Final counts: 2,033 WorkoutSessions, 2,033 Workouts, 12,283 WorkoutExercises, 31,660 SetLogs, 5,316 MaxSnapshots (deduplicated). All weights in kg. Import is idempotent — skips if WorkoutSessions already exist. Fixed 11 exercise name mismatches: 9 exercises added to `teambuildrNewExercises` (Bulgarian Split Squat, Glute Bridge, Kettlebell Swing, Nordic Hamstring Curl, Overhead Triceps Extension, Pendlay Row, Push-Ups, Romanian Deadlift With Dumbbells, Walking Barbell Lunge) and 2 case-sensitivity fixes added to `teambuildrToFreeExerciseDb` (Band Assisted Pull-up → Pull-Up, Bicep Exercise of choice → Choice). Total exercises now 948 (873 free-exercise-db + 75 new). Runtime type coercion applied for `prescribedLoad` (number → string), `reps` (string → number) from TeamBuildr JSON — types are looser at runtime than TypeScript definitions suggest.

### TeamBuildr Data Transformer (2026-02-18)
Transformer module at `src/lib/teambuildr/transformer.ts` with types at `src/lib/teambuildr/types.ts`. Validated against full 5-athlete export (37 MB). Key metrics: 2,033 dates → 2,033 sessions, 12,437 workout items → 12,283 exercises (97 non-exercises skipped, 57 empty items skipped), 31,660 sets with actual data, 16,681 raw max snapshots → 5,316 after deduplication. Prescription type distribution: RPE-based (8,206), fixed (3,974), percentage-based (103). 413 exercises in supersets. Data patterns: `value` = actual (what athlete logged), `placeholder` = prescribed (what coach programmed), `percentage` = %1RM. RPE extracted from `additionalInformation` free text with range support (e.g., "RPE 6-7" → 7). Michael Odermatt's last name had trailing whitespace in source data — transformer trims names.

### Exercise Tagging and TeamBuildr Name Mapping (2026-02-18)
Of 136 TeamBuildr exercise names: 6 are non-exercises (notes/surveys), 11 match free-exercise-db exactly (or case-insensitive), 53 map to existing free-exercise-db exercises via name normalization (e.g., "Back Squat" → "Barbell Squat", "Comp bench" → "Barbell Bench Press - Medium Grip"), and 66 are powerlifting-specific exercises created as new entries (Spoto Press, Larsen Press, paused/tempo variations, etc.). 165 total exercises now have powerlifting tags across 4 categories: competition_lift (7), competition_variation (51), accessory (74), gpp (33). Mapping module at `prisma/seed-data/exercise-tags.ts` exports: `freeExerciseDbTags`, `teambuildrToFreeExerciseDb`, `teambuildrNewExercises`, `teambuildrNonExercises`, and `resolveTeambuildrExerciseName()`. Total exercise count: 939 (873 free-exercise-db + 66 new).

### Exercise Model Extended for free-exercise-db (2026-02-18)
Exercise model `coachId` made optional (nullable) so library exercises from free-exercise-db don't require a coach. Added fields: `force`, `level`, `mechanic`, `equipment`, `primaryMuscles` (Json), `secondaryMuscles` (Json), `instructions` (Json), `images` (Json). Added indexes on `name` and `category` for search/filter. 873 exercises seeded — categories: strength (581), stretching (123), plyometrics (61), powerlifting (38), olympic weightlifting (35), strongman (21), cardio (14).

### DATABASE_URL Fix (2026-02-18)
The `.env` file had `DATABASE_URL="postgresql://localhost:5432/cannoli_trainer"` (missing username). Fixed to `postgresql://mattalldian@localhost:5432/cannoli_trainer`. The `cannoli_trainer` database was auto-created by `prisma migrate dev`.

### Codebase Baseline (2026-02-17)

**Current state**: The codebase is a research/interview platform — not yet a coaching tool. The Prisma schema has only a `Submission` model. Zero coaching pages, API routes, or domain components exist. All 66 plan tasks start from scratch except Task 13.6.

**What exists and is reusable**:
- **UI component library**: 10 shadcn-style components (Button, Card, Badge, Input, Textarea, Label, Checkbox, RadioGroup, Progress, Separator) with Radix UI primitives and CVA variants — directly reusable for all coaching UI
- **Layout components**: Header, Container, Footer — responsive, mobile-friendly, ready for nav updates
- **Prisma + PostgreSQL**: Infrastructure configured and deployed on Railway. Existing `Submission` model confirms UUID PK pattern (`@default(uuid())`), `createdAt/updatedAt` timestamps — matches spec requirements exactly
- **Prisma singleton**: `src/lib/prisma.ts` already exists for database access
- **TeamBuildr export script**: `scripts/teambuildr-export.ts` is fully implemented (Task 13.6) with rate limiting, resume/checkpoint, CLI flags, and supporting libraries in `scripts/lib/`

**Gaps confirmed (nothing partially done — all are net-new)**:
- No coaching domain models in Prisma (Coach, Athlete, Program, Workout, Exercise, SetLog, etc.)
- No seed script (`prisma/seed.ts` does not exist)
- No API routes for coaching (only `/api/submissions` exists)
- No coaching pages (`/dashboard`, `/athletes`, `/programs`, `/exercises`, `/train`, `/analytics`, `/meets` — all missing)
- No coaching components (`components/programs/`, `components/meets/`, `components/shared/` — none exist)
- No type definitions for coaching domain (`lib/programs/types.ts`, `lib/vbt/` — missing)
- No charting library installed (recharts or alternatives)

**Lint command broken**: `npm run lint` (`next lint`) fails with "Invalid project directory provided, no such directory: .../lint" on Next.js 16.1.6. This is a pre-existing issue — may need an eslint config file or Next.js 16 migration fix. Does not block schema work since `tsc --noEmit` and `npm run build` both pass.

**Header nav issue**: Current Header (`src/components/layout/Header.tsx`) contains research hub navigation (Home, Research, Interview, Submissions, Findings, PRD). Task 9.5 must either replace these or add a mode switch. The branding also says "S&C Research Hub" — will need renaming to Cannoli Trainer or similar.

**Authentication gap**: Spec 10 (Remote Program Delivery) requires athlete authentication (magic link / email login), but no auth tasks exist in the plan. This is deferred — the initial coach-facing build can use a hardcoded coach context. Auth should be added before the athlete portal (Priority 8+) goes live, but does not block Priorities 1-7.

**No contradictions found**: All spec requirements are internally consistent. The plan's priority ordering matches the dependency chain (schema → API → UI → advanced features).

**Task 13.6 confirmed complete**: The export script handles all specified acceptance criteria including --help flag, --token, --account, --output, --resume, plus additional --athletes and --concurrency flags. Supporting `scripts/lib/` includes: `teambuildr-client.ts` (API wrapper), `rate-limiter.ts`, `retry.ts`, `checkpoint.ts` (resume support), `logger.ts`.

### Import Validation (2026-02-18)
Validation script at `scripts/validate-import.ts` runs 42 checks (aggregate, per-athlete, data integrity) — all pass. Key finding: TeamBuildr's summary endpoint (`summaries.tonnage`, `summaries.repsCompleted`) underreports compared to raw set data. DB consistently has 16-47% more tonnage and 63-302% more reps than the summary endpoint reports. This is because the summary only counts "fully completed" exercises, while our import stores all sets with actual weight/rep data from `tableData`. This is correct behavior — we have **more** complete data than TeamBuildr's own summary view.

### Plan Restructuring (2026-02-17)

**Real data seeding moved to Priority 2**: Previously, data migration was Priority 13 (last). Now real data flows in immediately after the schema is ready:
- Old Task 1.9 (seed 30 exercises) replaced with Priority 2 (8 tasks) covering free-exercise-db import, TeamBuildr data transformer, athlete/workout import, validation, calculation libraries, and RPE table
- Old Tasks 13.1-13.2 (WorkoutSession, MaxSnapshot, superset fields) moved to Tasks 1.9-1.10 in Priority 1
- Old Tasks 13.3-13.5 (import endpoint, transformer, validation) restructured into Tasks 2.3-2.6
- Old Task 13.6 (export script, already complete) moved to Priority 14
- All subsequent priorities renumbered (old P2→P3, old P3→P4, etc.)
- Two new data sources: (1) TeamBuildr 37 MB export (5 athletes, 2,033 dates) and (2) free-exercise-db (800+ exercises, public domain)
- Net change: 66 → 70 tasks (added 8 seeding tasks, removed 1 old seed task, consolidated 5 old migration tasks into new structure)

### Spec Review & Deferred Features Expansion (2026-02-18)

Systematic review of all 12 specs, PRD, implementation plan, and 11 research documents revealed 97 additional tasks across 17 new priority groups (17-33). These cover:
- **Critical gaps**: Workout scheduling (no mechanism to map program days to calendar dates), authentication (no auth exists), messaging (WhatsApp dependency), athlete progress visibility (athletes can't see their own data)
- **Deferred features**: Every spec had Phase 2 / deferred features that were identified but never tasked
- **Implied features**: 27 implied features found by cross-referencing specs (empty states, toasts, validation, error boundaries, pagination, confirm dialogs, etc.)
- **Athlete experience gaps**: Research review found 4 new specs needed; 2 HIGH priority specs written (Athlete Progress Dashboard, Coach-Athlete Messaging)

New specs created: 13 (Scheduling), 14 (Notifications), 15 (Athlete Progress Dashboard), 16 (Coach-Athlete Messaging)
Updated specs: 02, 03, 04, 05, 06, 07, 08, 09, 10, 12

Net change: 82 → 179 tasks (+97 new tasks in priorities 17-33)

---

## Phase 2: Extended Features (Priorities 17-33)

### Priority 17: Workout Scheduling & Calendar

- [x] **Task 17.1**: Add scheduling fields to ProgramAssignment and WorkoutSession in Prisma schema
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: ProgramAssignment gains `trainingDays` (Json, default `[1,2,4,5]`) and `isActive` (Boolean, default true). WorkoutSession gains `workoutId` (FK -> Workout, optional), `programAssignmentId` (FK -> ProgramAssignment, optional), `isManuallyScheduled` (Boolean, default false), `isSkipped` (Boolean, default false), `weekNumber` (Int?), `dayNumber` (Int?). Migration runs successfully. `npx prisma validate` passes.

- [x] **Task 17.2**: Implement schedule generation service at `src/lib/scheduling/generate-schedule.ts`
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: Pure function `generateSchedule(workouts, startDate, trainingDays)` returns an array of `{ date, workoutId, weekNumber, dayNumber, title }` objects. Maps abstract Week/Day pairs to concrete calendar dates using training day config. Handles programs where days-per-week exceeds training days (spillover). Handles programs where days-per-week is less than training days (rest gaps). Unit tested with at least 5 test cases covering 3-day, 4-day, 5-day, and spillover scenarios.

- [x] **Task 17.3**: Implement schedule persistence — create WorkoutSessions from generated schedule
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: `persistSchedule(athleteId, programId, programAssignmentId, schedule)` creates WorkoutSession records in a transaction. Links each session to the source Workout via `workoutId` and to the assignment via `programAssignmentId`. Idempotent — skips dates where a session already exists. Returns count of created/skipped sessions.

- [ ] **Task 17.4**: Integrate scheduling into program assignment API (`/api/programs/[id]/assign`)
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: POST to `/api/programs/[id]/assign` with `{ athleteId, startDate, trainingDays? }` creates ProgramAssignment AND generates WorkoutSessions. If `trainingDays` is omitted, defaults to `[1,2,4,5]`. Response includes count of generated sessions. Integration test: assign a 4-week/4-day program and verify 16 WorkoutSessions are created on correct dates.

- [ ] **Task 17.5**: Add conflict detection for overlapping program assignments
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: Before generating sessions, check for existing WorkoutSessions on the target dates for the athlete. If conflicts found, return them in the API response. Coach can choose to proceed (overwrite) or cancel.

- [ ] **Task 17.6**: Implement reassignment cleanup — delete future NOT_STARTED sessions on assignment removal
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: When a ProgramAssignment is deleted (or `isActive` set to false), delete all WorkoutSessions where `programAssignmentId` matches AND `status = NOT_STARTED` AND `date >= today`. Preserve sessions with status `PARTIALLY_COMPLETED` or `FULLY_COMPLETED`.

- [ ] **Task 17.7**: Enhance `/api/train` to return `nextSession` when no workout exists for today
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: When no WorkoutSession exists for the requested date, the response includes `nextSession: { date, title, programName }` by querying the next upcoming NOT_STARTED session.

- [ ] **Task 17.8**: Create coach calendar page at `/schedule` with weekly view
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: Page renders a 7-day week grid. Rows are athletes (filterable). Columns are Monday-Sunday. Each cell shows the WorkoutSession title for that athlete+date, or empty for rest days. Current week shown by default. Forward/backward navigation changes the displayed week.

- [ ] **Task 17.9**: Create schedule API route at `/api/schedule`
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: GET `/api/schedule?startDate=...&endDate=...&athleteId=all` returns athletes with their sessions for the date range. Supports filtering by athleteId.

- [ ] **Task 17.10**: Implement manual workout move on calendar
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: Coach can move a workout from one date to another via the calendar UI. Moving updates the WorkoutSession's `date` field and sets `isManuallyScheduled = true`. If the target date already has a session, swap the two sessions' dates.

- [ ] **Task 17.11**: Implement skip workout action on calendar
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: Coach can mark a workout as skipped. Sets `isSkipped = true`. Skipped sessions appear visually distinct (strikethrough or dimmed). Only NOT_STARTED sessions can be skipped.

- [ ] **Task 17.12**: Add training day selector to program assignment dialog
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: "Assign to Athlete" flow gains a training day configuration UI. Shows 7 day-of-week checkboxes with Mon/Tue/Thu/Fri pre-checked. Presets available: "4-Day", "3-Day", "5-Day", "Custom".

- [ ] **Task 17.13**: Unit test scheduling service with edge cases
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: Tests cover standard, spillover, mid-week start, empty program, and weekend scenarios. All pass with `npx vitest run`.

- [ ] **Task 17.14**: Integration test full assignment-to-train flow
  - Spec: specs/13-workout-scheduling-calendar.md
  - Acceptance: End-to-end: create program, assign to athlete, verify WorkoutSessions created, call `/api/train` for scheduled date, verify correct exercises returned.

### Priority 18: Authentication & Athlete Portal

- [ ] **Task 18.1**: Install NextAuth v5, Prisma adapter, and Resend; configure auth
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: `next-auth@5`, `@auth/prisma-adapter`, `resend` installed. `src/lib/auth.ts` exports auth config. API route at `src/app/api/auth/[...nextauth]/route.ts`. `.env.example` documents all auth env vars. `npm run build` passes.

- [ ] **Task 18.2**: Add NextAuth models to Prisma schema and link Athlete to User
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: `User`, `Account`, `Session`, `VerificationToken` models added. `Athlete` gets optional `userId String? @unique`. Migration runs.

- [ ] **Task 18.3**: Build athlete login page at `/athlete/login` with magic link form
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: Email input + "Send Login Link" button. Success redirects to `/athlete/check-email`. Error shows inline message. Mobile-optimized.

- [ ] **Task 18.4**: Build "Check your email" confirmation page at `/athlete/check-email`
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: Confirmation message, email provider hints, "Try again" link.

- [ ] **Task 18.5**: Add Next.js middleware to protect `/athlete/*` routes
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: `src/middleware.ts` protects all `/athlete/*` routes except login and check-email. Unauthenticated requests redirect to `/athlete/login`. Coach routes unaffected.

- [ ] **Task 18.6**: Create athlete layout with mobile bottom navigation
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: Bottom nav with 4 tabs (Dashboard, Train, Calendar, History), SessionProvider, Cannoli branding, 44px tap targets.

- [ ] **Task 18.7**: Build athlete dashboard page at `/athlete`
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: Hero card with today's workout, quick stats (streak, weekly workouts, completion rate), last 3 sessions.

- [ ] **Task 18.8**: Build athlete training view at `/athlete/train` reusing TrainingLog
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: TrainingLog with `mode: 'athlete'` (no athlete selector). All existing functionality works with authenticated athlete session.

- [ ] **Task 18.9**: Build athlete calendar view at `/athlete/calendar`
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: Weekly calendar with workout indicators, completion %, month toggle. Past from WorkoutSession, future from ProgramAssignment.

- [ ] **Task 18.10**: Build athlete history view at `/athlete/history`
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: Reverse-chronological WorkoutSession list, tap to expand, pagination (20 per page).

- [ ] **Task 18.11**: Send email notification on program assignment
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: Resend email with program name, start date, link to `/athlete/train`. Fire-and-forget.

- [ ] **Task 18.12**: Send email notification on workout completion
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: Email to coach with athlete name, workout name, completion %. Only on transition to FULLY_COMPLETED.

- [ ] **Task 18.13**: Add PWA manifest and mobile meta tags for "Add to Home Screen"
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: `public/manifest.json`, meta tags, apple-touch-icon. Chrome DevTools shows valid manifest.

- [ ] **Task 18.14**: Seed test athlete with email for auth testing
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: At least one athlete seeded with real email. Linked to User if exists.

### Priority 19: Athlete Management Enhancements

- [ ] **Task 19.1**: Implement bulk program assignment for multiple athletes
  - Spec: specs/03-athlete-management.md
  - Acceptance: Checkboxes on athlete rows, bulk "Assign Program" action, program picker dialog, success toast. Existing assignments skipped.

- [ ] **Task 19.2**: Add bodyweight trend chart to athlete profile page
  - Spec: specs/03-athlete-management.md
  - Acceptance: Line chart on `/athletes/[id]` when BodyweightLog data exists. Recharts, 90-day default. Hidden when no data.

- [ ] **Task 19.3**: Add per-athlete analytics link on athlete profile
  - Spec: specs/03-athlete-management.md
  - Acceptance: "View Analytics" button navigates to `/analytics?athleteId=[id]`.

### Priority 20: Exercise Library Enhancements

- [ ] **Task 20.1**: Implement tag filter UI on exercise library page
  - Spec: specs/05-exercise-library.md
  - Acceptance: Tag filter alongside category filter. Multi-select chips. AND logic with category filter.

- [ ] **Task 20.2**: Implement edit exercise form
  - Spec: specs/05-exercise-library.md
  - Acceptance: Edit button, pre-populated form, PUT `/api/exercises/[id]`, shared form component.

- [ ] **Task 20.3**: Implement delete exercise with usage protection
  - Spec: specs/05-exercise-library.md
  - Acceptance: Usage check before delete. Warning if referenced. Confirmation if unreferenced.

### Priority 21: Training Log Enhancements

- [ ] **Task 21.1**: Implement rest timer between sets
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: Rest timer after completing a set. Defaults to WorkoutExercise.restTimeSeconds or 120s. Start/pause/dismiss controls. Audio/vibration at zero.

- [ ] **Task 21.2**: Add per-exercise notes field for athlete comments
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: Collapsible "Notes" textarea per exercise. Persisted. Coach-visible.

- [ ] **Task 21.3**: Document offline queueing approach (stretch goal)
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: Design doc describing localStorage queue strategy, background sync, pending indicator.

- [ ] **Task 21.4**: Implement offline queue for set logs with localStorage
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: Failed POSTs saved to localStorage. Replayed on connectivity. "N sets pending sync" badge. 100 entry limit.

### Priority 22: Dashboard Quick Actions & Loading States

- [ ] **Task 22.1**: Build quick action buttons (create program, add athlete, view analytics)
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: CTA buttons/FAB with links to key pages. Visible on mobile.

- [ ] **Task 22.2**: Add skeleton loading states for all dashboard sections
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: Pulse-animated placeholders in Suspense boundaries. No layout shift.

### Priority 23: Program Overview, Notes, Auto-Save

- [ ] **Task 23.1**: Build program overview compact grid showing weekly structure at a glance
  - Spec: specs/04-program-builder.md
  - Acceptance: Weeks as rows, days as columns, exercise count per cell, click to navigate.

- [ ] **Task 23.2**: Surface notes fields at exercise, day, and program levels
  - Spec: specs/04-program-builder.md
  - Acceptance: Program description, day notes, exercise notes. Note icon when collapsed with content. Persisted on save.

- [ ] **Task 23.3**: Implement auto-save with dirty state tracking and save indicator
  - Spec: specs/04-program-builder.md
  - Acceptance: 2s debounce save, "Saving..."/"All changes saved" indicator, beforeunload warning.

### Priority 24: Analytics Enhancements

- [ ] **Task 24.1**: Build RPE distribution histogram and RPE accuracy metric
  - Spec: specs/07-progress-analytics.md
  - Acceptance: Bar chart of set count per RPE bin, filterable by exercise. Accuracy metric from rpe-table reverse lookup.

- [ ] **Task 24.2**: Build athlete comparison view (overlay 2-3 athletes on same chart)
  - Spec: specs/07-progress-analytics.md
  - Acceptance: Multi-select dropdown, overlaid color-coded trend lines, max 3 athletes.

- [ ] **Task 24.3**: Embed per-athlete analytics on athlete profile page
  - Spec: specs/07-progress-analytics.md
  - Acceptance: Analytics tab on `/athletes/[id]` with pre-filtered charts. Link to full analytics.

### Priority 25: VBT Fatigue Tracking

- [ ] **Task 25.1**: Implement within-session velocity loss display per exercise
  - Spec: specs/08-vbt-integration.md
  - Acceptance: Velocity drop % from set 1 to final set. Flag when >20%. "N/A" for <2 velocity sets.

- [ ] **Task 25.2**: Build cross-session velocity trend chart (week-over-week fatigue)
  - Spec: specs/08-vbt-integration.md
  - Acceptance: Line chart of mean velocity at ~80% 1RM over weeks. Alert on >5% week-over-week drop. Requires 3+ weeks of data.

### Priority 26: Competition Results Enhancements

- [ ] **Task 26.1**: Build post-meet results entry UI with make/miss per attempt
  - Spec: specs/09-competition-prep.md
  - Acceptance: 3 attempts per lift per athlete with good/miss toggle. Auto-calculate best attempt and total. Results in MeetEntry `attemptResults` JSON.

- [ ] **Task 26.2**: Build meet results summary with DOTS and Wilks scores
  - Spec: specs/09-competition-prep.md
  - Acceptance: Results card per athlete with best attempts, total, DOTS, Wilks. Uses `powerlifting-formulas` package. Handles missed lifts.

### Priority 27: RPE/RIR Enhancements

- [ ] **Task 27.1**: Build RPE history chart on athlete analytics (RPE over time per exercise)
  - Spec: specs/12-rpe-rir-support.md
  - Acceptance: Scatter + trend line chart of RPE values over time. Filterable by exercise. Individual sets as scatter points, moving average as trend line.

- [ ] **Task 27.2**: Implement RPE accuracy metric (reported vs estimated effort)
  - Spec: specs/12-rpe-rir-support.md
  - Acceptance: `lib/analytics/rpe-accuracy.ts` exports `calculateRpeAccuracy()`. Compares reported RPE to estimated via rpe-table reverse lookup. Per-exercise and aggregate "avg +/- X RPE" metric. Trend chart. Unit tested.

- [ ] **Task 27.3**: Build autoregulated prescription display and RIR co-display
  - Spec: specs/12-rpe-rir-support.md
  - Acceptance: "Work up to RPE X, then -Y%" when `prescriptionType = autoregulated`. RPE/RIR co-display (e.g., "RPE 8 / 2 RIR"). `RPEWithRIR` shared component. Half-increments supported.

### Priority 28: Infrastructure & Data Integrity

- [ ] **Task 28.1**: Create Notification model and database migration
  - Spec: specs/14-notifications.md
  - Acceptance: `Notification` model with recipientId, recipientType, type, title, body, isRead. Migration runs. Indexed.

- [ ] **Task 28.2**: Integrate email service (Resend) for transactional notifications
  - Spec: specs/14-notifications.md
  - Acceptance: `src/lib/email.ts` wrapping Resend SDK. Error handling (never blocks caller). Branded email templates.

- [ ] **Task 28.3**: Add notification triggers to existing flows
  - Spec: specs/14-notifications.md
  - Acceptance: ProgramAssignment creates PROGRAM_ASSIGNED notification + email. WorkoutSession FULLY_COMPLETED creates WORKOUT_COMPLETED notification + email. Fire-and-forget.

- [ ] **Task 28.4**: Add notification preferences to Coach and Athlete models
  - Spec: specs/14-notifications.md
  - Acceptance: Json preference fields on Coach and Athlete models. Triggers check preferences before sending email.

- [ ] **Task 28.5**: Create `getCurrentCoachId()` utility and audit all queries
  - Spec: specs/tasks/00-implied-features-audit.md
  - Acceptance: `src/lib/coach.ts` exports utility. Every coach-scoped query uses `coachId` filter. Hardcoded for now, swapped to session when auth added.

- [ ] **Task 28.6**: Add `isArchived` field to Program model for soft-delete
  - Spec: specs/01-data-models-and-schema.md
  - Acceptance: `isArchived Boolean @default(false)`. All list queries filter. "Archive" replaces "Delete". Hard delete only when zero assignments/sessions.

- [ ] **Task 28.7**: Add `isActive` field to Athlete model for archive vs hard delete
  - Spec: specs/03-athlete-management.md
  - Acceptance: `isActive Boolean @default(true)`. Default filter to active only. "Archived" tab. Reactivation supported. Hard delete only when zero data.

- [ ] **Task 28.8**: Add make/miss fields to MeetEntry model
  - Spec: specs/09-competition-prep.md
  - Acceptance: 9 boolean fields for attempt results. UI indicators. Migration runs.

### Priority 29: Settings & Preferences

- [ ] **Task 29.1**: Add settings fields to Coach model
  - Spec: specs/01-data-models-and-schema.md
  - Acceptance: `defaultWeightUnit`, `timezone`, `defaultRestTimerSeconds` fields. Migration runs.

- [ ] **Task 29.2**: Create Settings page at `/settings`
  - Spec: specs/tasks/00-implied-features-audit.md
  - Acceptance: Profile and preferences sections. Server action save. Success toast. Gear icon in nav.

- [ ] **Task 29.3**: Create Settings API route for coach preferences
  - Spec: specs/tasks/00-implied-features-audit.md
  - Acceptance: GET/PUT `/api/settings`. Zod validation. Returns updated coach record.

- [ ] **Task 29.4**: Wire default weight unit preference into set logging
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: SetLog unit defaults to coach's `defaultWeightUnit`. UI pre-selects. Per-set override still works.

- [ ] **Task 29.5**: Wire default rest timer into training log
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: Rest timer defaults to coach's `defaultRestTimerSeconds`. Per-session override still works.

### Priority 30: UX Polish

- [ ] **Task 30.1**: Create shared EmptyState component
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: `src/components/ui/EmptyState.tsx` with icon, title, description, optional CTA. Centered layout.

- [ ] **Task 30.2**: Add empty states to all coach pages
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: Dashboard, athletes, programs, exercises, analytics, meets, and athlete/train all have appropriate empty states with CTAs.

- [ ] **Task 30.3**: Install toast library and create toast wrapper
  - Spec: specs/tasks/00-implied-features-audit.md
  - Acceptance: `sonner` installed. `<Toaster />` in root layout. `src/lib/toast.ts` exports `showSuccess`, `showError`, `showLoading`. Bottom-right desktop, bottom-center mobile.

- [ ] **Task 30.4**: Add success and error toasts to all mutation actions
  - Spec: specs/tasks/00-implied-features-audit.md
  - Acceptance: Every create/update/delete shows success toast. Failed API calls show error toast. No toast on set logging (too frequent).

- [ ] **Task 30.5**: Add inline form validation to all forms
  - Spec: specs/tasks/00-implied-features-audit.md
  - Acceptance: Zod schemas for all forms. Inline error messages on blur/submit. Red borders. User-friendly messages.

- [ ] **Task 30.6**: Create shared ConfirmDialog component
  - Spec: specs/tasks/00-implied-features-audit.md
  - Acceptance: Radix AlertDialog wrapper. Destructive variant. Used for archive athlete, archive program, delete exercise, delete meet, unassign program.

- [ ] **Task 30.7**: Add React error boundaries to page routes
  - Spec: specs/tasks/00-implied-features-audit.md
  - Acceptance: `error.tsx` files for dashboard, athletes, programs, analytics, meets, athlete. "Something went wrong" + "Try again" button. Dev-only console error logging.

- [ ] **Task 30.8**: Add skeleton loading states to all pages
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: `loading.tsx` files for each route with `animate-pulse` skeleton shapes matching actual content layout.

### Priority 31: Missing UI Features

- [ ] **Task 31.1**: Build workout history list component for coach athlete view
  - Spec: specs/03-athlete-management.md
  - Acceptance: "Training History" section on `/athletes/[id]` with paginated WorkoutSession list. Date, name, completion %, volume, duration. 20 per page.

- [ ] **Task 31.2**: Build workout session detail view with prescribed vs actual comparison
  - Spec: specs/03-athlete-management.md
  - Acceptance: Session detail shows Prescribed vs Actual columns per exercise. Green/yellow/red indicators. Total volume comparison.

- [ ] **Task 31.3**: Add coach notes to completed workout sessions
  - Spec: specs/03-athlete-management.md
  - Acceptance: `coachNotes String? @db.Text` on WorkoutSession. Text area in session detail. PATCH API. Visible to both coach and athlete.

- [ ] **Task 31.4**: Enable program builder edit mode for existing programs
  - Spec: specs/04-program-builder.md
  - Acceptance: `/programs/[id]/edit` loads existing data into builder. PUT to update. "Edit: {name}" title. Edit button on program cards.

- [ ] **Task 31.5**: Add edit-in-progress warning for programs with active assignments
  - Spec: specs/04-program-builder.md
  - Acceptance: Warning banner when editing assigned programs. Shows count and names of assigned athletes. Editing still allowed.

- [ ] **Task 31.6**: Add bodyweight logging entry point
  - Spec: specs/07-progress-analytics.md
  - Acceptance: "Log Bodyweight" button on athlete profile. Quick-entry form (weight, unit, date). Optional post-workout bodyweight field. POST `/api/bodyweight`.

- [ ] **Task 31.7**: Add pagination to exercise library, training history, and activity feed
  - Spec: specs/05-exercise-library.md
  - Acceptance: Exercise library: 30 per page server-side. Dashboard feed: 20 items. Exercise picker: server-side search with debounce. Paginated response shape `{ data, total, hasMore }`.

- [ ] **Task 31.8**: Display superset grouping in the training log
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: Exercises with same `supersetGroup` visually grouped. Colored left border, "Superset" label, reduced spacing. Non-superset exercises normal.

### Priority 32: Athlete Progress Dashboard

- [ ] **Task 32.1**: Create athlete progress API endpoint
  - Spec: specs/15-athlete-progress-dashboard.md
  - Acceptance: `GET /api/athlete/progress?range=8w` returns `AthleteProgressData`: e1RM trends, weekly volume, compliance, personal records, bodyweight, available exercises. Session-authenticated, scoped to athlete. Range supports `4w`, `8w`, `12w`, `all`. Unit tested.

- [ ] **Task 32.2**: Build e1RM trend line chart for athlete progress page
  - Spec: specs/15-athlete-progress-dashboard.md
  - Acceptance: Recharts LineChart of estimated 1RM over time. Exercise dropdown defaults to competition lifts. Date range selector. Reuses chart wrappers from Spec 07.

- [ ] **Task 32.3**: Build weekly volume bar chart for athlete progress page
  - Spec: specs/15-athlete-progress-dashboard.md
  - Acceptance: Recharts BarChart of weekly tonnage. Current week highlighted. Trend indicator (up/down arrow + %).

- [ ] **Task 32.4**: Build compliance ring and training streak display
  - Spec: specs/15-athlete-progress-dashboard.md
  - Acceptance: Donut chart for compliance %. Streak counter badge. Weekly and monthly compliance. Capped at 100%.

- [ ] **Task 32.5**: Build personal records list component
  - Spec: specs/15-athlete-progress-dashboard.md
  - Acceptance: All-time best per exercise from MaxSnapshot. "New PR" badge for last 7 days. Filterable by category. Sorted most recent first.

- [ ] **Task 32.6**: Build bodyweight trend chart (conditional render)
  - Spec: specs/15-athlete-progress-dashboard.md
  - Acceptance: LineChart of BodyweightLog entries. Current weight badge. Only renders with 2+ entries. Target weight class line if applicable.

- [ ] **Task 32.7**: Assemble athlete progress page and update bottom navigation
  - Spec: specs/15-athlete-progress-dashboard.md
  - Acceptance: `/athlete/progress` page with all charts. Bottom nav updated to 5 tabs (add "Progress" with TrendingUp icon). Server component data fetch. Mobile-optimized. Full-page empty state.

### Priority 33: Coach-Athlete Messaging

- [ ] **Task 33.1**: Add Conversation and Message models to Prisma schema
  - Spec: specs/16-coach-athlete-messaging.md
  - Acceptance: `Conversation` (coachId, athleteId, lastMessageAt, unreadCounts, unique constraint) and `Message` (conversationId, senderId, senderType, content, readAt) models. `SenderType` enum. Indexes. Migration runs.

- [ ] **Task 33.2**: Create messaging API routes (send, list, read, mark-read)
  - Spec: specs/16-coach-athlete-messaging.md
  - Acceptance: POST `/api/messages` (send), GET `/api/messages` (coach inbox), GET `/api/messages/[athleteId]` (thread, paginated), PATCH `/api/messages/[athleteId]/read` (mark read). Auto-creates conversation on first message. Auth-validated. Unit tested.

- [ ] **Task 33.3**: Build conversation list (coach inbox) page
  - Spec: specs/16-coach-athlete-messaging.md
  - Acceptance: `/messages` page with athlete name, last message preview, timestamp, unread badge. Sorted by most recent. Polling every 30s. Empty state.

- [ ] **Task 33.4**: Build message thread component (shared coach + athlete)
  - Spec: specs/16-coach-athlete-messaging.md
  - Acceptance: Chronological messages with date headers. Coach right-aligned, athlete left-aligned. MessageInput with Enter-to-send. Optimistic updates. Auto-scroll. "Load older" pagination. Marks as read on mount.

- [ ] **Task 33.5**: Build coach message thread page and athlete profile integration
  - Spec: specs/16-coach-athlete-messaging.md
  - Acceptance: `/messages/[athleteId]` page with MessageThread. "Message" button on athlete profile. Conversation auto-created on first message.

- [ ] **Task 33.6**: Build athlete messaging view
  - Spec: specs/16-coach-athlete-messaging.md
  - Acceptance: `/athlete/messages` with single conversation thread. Message icon on dashboard. FAB on other athlete pages. Empty state.

- [ ] **Task 33.7**: Add unread badge to coach navigation and implement polling
  - Spec: specs/16-coach-athlete-messaging.md
  - Acceptance: "Messages" in coach header nav with unread badge. Badge polls every 60s. Thread polls every 10s when open. Polling pauses on page hidden.

- [ ] **Task 33.8**: Implement delayed email notification for unread messages
  - Spec: specs/16-coach-athlete-messaging.md
  - Acceptance: 5-minute delayed check after coach sends message. If unread, email athlete via Resend. Respects mute preference. No email for athlete-to-coach messages.
