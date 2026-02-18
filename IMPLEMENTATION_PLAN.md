# Implementation Plan

## Status
- Total tasks: 82
- Completed: 18
- In progress: 0

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

- [ ] **Task 2.8**: Implement RPE/RIR-to-%1RM lookup table as data module
  - Spec: specs/12-rpe-rir-support.md, summaries/open-source-exercise-databases-apis-powerlifting-resources.md
  - Acceptance: `src/lib/rpe-table.ts` exports lookup function: given RPE (6-10) and reps (1-12), returns %1RM. Covers ~50 data points from Tuchscherer RPE table. TypeScript typed, unit tested.

### Priority 3: Testing Infrastructure & Data Validation

- [ ] **Task 3.1**: Install Vitest and configure for Next.js + Prisma project
  - Spec: (none — infrastructure)
  - Acceptance: `npx vitest run` executes with zero tests. `vitest.config.ts` configures path aliases (`@/*`), TypeScript, and test file patterns. `package.json` has `"test": "vitest run"` script. AGENTS.md updated with test command.

- [ ] **Task 3.2**: Unit test TeamBuildr data transformer against known export data
  - Spec: summaries/teambuildr-api-exploration-findings.md
  - Acceptance: Tests verify: prescribed (placeholder) vs actual (value) extraction, superset grouping mapping, exercise type code mapping (L→Lift, S→SAQ+C, etc.), workingMax/generatedMax→MaxSnapshot conversion, RPE extraction from additionalInformation. Uses real sample data from export.

- [ ] **Task 3.3**: Unit test 1RM calculation library and RPE/RIR lookup table
  - Spec: specs/12-rpe-rir-support.md, summaries/open-source-exercise-databases-apis-powerlifting-resources.md
  - Acceptance: Tests verify: `calculateOneRepMax(140, 5)` returns expected value for each formula (Epley, Brzycki). RPE table returns correct %1RM for known inputs (RPE 10 @ 1 rep = 100%, RPE 8 @ 5 reps = 76%). Wilks/DOTS return expected scores for known bodyweight+total combos.

- [ ] **Task 3.4**: Integration test seed script — verify import counts match source data
  - Spec: summaries/teambuildr-api-exploration-findings.md
  - Acceptance: Test seeds a test database, then asserts: 5 athletes, 2,033 WorkoutSessions, 12,437 WorkoutExercises, 16,552 SetLogs, 1,806 MaxSnapshots (PRs), 136+ exercises. Per-athlete tonnage matches source totals. Uses Prisma test client with isolated database or transaction rollback.

- [ ] **Task 3.5**: Integration test API routes with seeded data (CRUD operations)
  - Spec: specs/02-coach-dashboard.md, specs/03-athlete-management.md
  - Acceptance: Tests hit API routes against seeded database: GET `/api/athletes` returns 5 athletes, GET `/api/athletes/[id]` returns correct profile, GET `/api/exercises` returns 800+ exercises with search filtering, POST/PUT/DELETE operations work and persist. Uses Next.js test server or direct route handler calls.

- [ ] **Task 3.6**: Install Playwright and create E2E smoke tests for core pages
  - Spec: (none — infrastructure)
  - Acceptance: `npx playwright test` runs headless Chrome. Smoke tests verify: homepage loads, `/athletes` lists 5 athletes, `/exercises` shows exercise library with search, `/dashboard` displays stat cards with non-zero values, `/analytics` renders charts. All assertions against real seeded data.

### Priority 4: Core API Routes

- [ ] **Task 4.1**: Create CRUD API routes for Coach (`/api/coaches`)
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: POST creates coach, GET returns coach profile

- [ ] **Task 4.2**: Create CRUD API routes for Athletes (`/api/athletes`, `/api/athletes/[id]`)
  - Spec: specs/03-athlete-management.md
  - Acceptance: POST/GET/PUT/DELETE work, GET supports search query param

- [ ] **Task 4.3**: Create CRUD API routes for Programs (`/api/programs`, `/api/programs/[id]`)
  - Spec: specs/04-program-builder.md
  - Acceptance: POST/GET/PUT/DELETE work, includes nested workout/exercise data

- [ ] **Task 4.4**: Create CRUD API routes for Exercises (`/api/exercises`)
  - Spec: specs/05-exercise-library.md
  - Acceptance: POST/GET/PUT/DELETE work, GET supports search and category filter

- [ ] **Task 4.5**: Create API routes for SetLog entries (`/api/sets`)
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: POST creates set log, GET returns sets for athlete+exercise

- [ ] **Task 4.6**: Create API routes for BodyweightLog (`/api/bodyweight`)
  - Spec: specs/07-progress-analytics.md
  - Acceptance: POST creates log, GET returns history for athlete

- [ ] **Task 4.7**: Create API routes for Meets (`/api/meets`, `/api/meets/[id]`)
  - Spec: specs/09-competition-prep.md
  - Acceptance: POST/GET/PUT work, includes meet entries with athlete data

- [ ] **Task 4.8**: Create program assignment API (`/api/programs/[id]/assign`)
  - Spec: specs/04-program-builder.md
  - Acceptance: POST assigns program to athlete(s), creates ProgramAssignment records

- [ ] **Task 4.9**: Create analytics data API (`/api/analytics/[athleteId]`)
  - Spec: specs/07-progress-analytics.md
  - Acceptance: GET returns aggregated data (1RM trends, volume, compliance) for date range

### Priority 5: Core UI - Athlete Management

- [ ] **Task 5.1**: Create athlete listing page at `/athletes` with search and filter
  - Spec: specs/03-athlete-management.md
  - Acceptance: Page renders athlete list, search filters by name, filter chips work

- [ ] **Task 5.2**: Create "Add Athlete" form with validation
  - Spec: specs/03-athlete-management.md
  - Acceptance: Form creates athlete via API, validates required fields

- [ ] **Task 5.3**: Create athlete profile page at `/athletes/[id]` with tabs for info, training, analytics
  - Spec: specs/03-athlete-management.md
  - Acceptance: Profile shows athlete data, current program, recent training

- [ ] **Task 5.4**: Add edit and delete functionality to athlete profile
  - Spec: specs/03-athlete-management.md
  - Acceptance: Edit saves changes, delete shows confirmation then removes

### Priority 6: Core UI - Exercise Library

- [ ] **Task 6.1**: Create exercise library page at `/exercises` with search and category filter
  - Spec: specs/05-exercise-library.md
  - Acceptance: Page lists exercises, search and filter work

- [ ] **Task 6.2**: Create "Add Exercise" form with name, category, video URL, cues, tags
  - Spec: specs/05-exercise-library.md
  - Acceptance: Form creates exercise, video URL renders embed preview

- [ ] **Task 6.3**: Create reusable ExercisePicker component for program builder
  - Spec: specs/05-exercise-library.md
  - Acceptance: Modal/popover with search, selecting exercise returns exercise data

### Priority 7: Core UI - Program Builder

- [ ] **Task 7.1**: Create program listing page at `/programs` showing programs and templates
  - Spec: specs/04-program-builder.md
  - Acceptance: Page lists programs with name, athlete count, duration, type

- [ ] **Task 7.2**: Create program builder types in `lib/programs/types.ts`
  - Spec: specs/04-program-builder.md
  - Acceptance: TypeScript interfaces for program editing state compile without errors

- [ ] **Task 7.3**: Create program builder page at `/programs/new` with week/day structure
  - Spec: specs/04-program-builder.md
  - Acceptance: Can create program, add weeks, add days within weeks

- [ ] **Task 7.4**: Add exercise addition to program builder with prescription type selector
  - Spec: specs/04-program-builder.md
  - Acceptance: Can add exercise from library, select prescription type, enter prescription values

- [ ] **Task 7.5**: Implement prescription type conditional fields (RPE, %1RM, RIR, velocity, auto, fixed)
  - Spec: specs/04-program-builder.md, specs/12-rpe-rir-support.md
  - Acceptance: All 6 prescription types show correct input fields

- [ ] **Task 7.6**: Add week/day/exercise duplication in program builder
  - Spec: specs/04-program-builder.md
  - Acceptance: Duplicate week copies all days/exercises, duplicate day copies exercises

- [ ] **Task 7.7**: Add exercise reordering within a day
  - Spec: specs/04-program-builder.md
  - Acceptance: Move up/down buttons change exercise order

- [ ] **Task 7.8**: Implement program save (create/update) to database via API
  - Spec: specs/04-program-builder.md
  - Acceptance: Saving program persists all weeks/days/exercises to database

- [ ] **Task 7.9**: Add "Assign to Athlete" flow on program page
  - Spec: specs/04-program-builder.md
  - Acceptance: Select athletes from list, assign creates ProgramAssignment records

### Priority 8: Template System

- [ ] **Task 8.1**: Add "Save as Template" button to program builder
  - Spec: specs/11-template-system.md
  - Acceptance: Creates template copy of program (isTemplate=true, no athlete loads)

- [ ] **Task 8.2**: Create template listing page at `/programs/templates`
  - Spec: specs/11-template-system.md
  - Acceptance: Lists templates with metadata, search, and filter by periodization type

- [ ] **Task 8.3**: Add "Create from Template" flow
  - Spec: specs/11-template-system.md
  - Acceptance: Creates new program from template structure without athlete-specific loads

### Priority 9: RPE/RIR Support Components

- [ ] **Task 9.1**: Create RPESelector component with 1-10 scale (0.5 increments)
  - Spec: specs/12-rpe-rir-support.md
  - Acceptance: Component renders scale, supports selection, shows RPE descriptions

- [ ] **Task 9.2**: Create RPE reference chart popover component
  - Spec: specs/12-rpe-rir-support.md
  - Acceptance: Info icon opens popover showing RPE 1-10 with descriptions

### Priority 10: Athlete Training Log

- [ ] **Task 10.1**: Create training log page at `/train` showing today's workout
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: Displays assigned exercises with prescriptions, mobile-optimized

- [ ] **Task 10.2**: Implement set logging interface with reps, weight, RPE, velocity inputs
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: Each set has input fields, completing set saves to database

- [ ] **Task 10.3**: Add previous performance reference per exercise
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: Shows "Last: X lbs x Y reps" from most recent session

- [ ] **Task 10.4**: Add workout completion summary card
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: After all exercises, shows total volume, sets, top RPE

### Priority 11: Coach Dashboard

- [ ] **Task 11.1**: Create dashboard page at `/dashboard` with overview stat cards
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: Shows total athletes, active programs, workouts this week

- [ ] **Task 11.2**: Add recent activity feed to dashboard
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: Shows last 7 days of athlete training logs grouped by day

- [ ] **Task 11.3**: Add "Needs Attention" section flagging inactive athletes
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: Shows athletes with no logs in 3+ days

- [ ] **Task 11.4**: Add upcoming meets section to dashboard
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: Shows meets in next 30 days with athlete count

- [ ] **Task 11.5**: Update Header nav to include Dashboard, Athletes, Programs, Exercises links
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: Nav links route to correct pages, active state shown
  - Note: Current Header has research hub links (Home, Research, Interview, Submissions, Findings, PRD). Must replace or restructure for coaching platform nav.

### Priority 12: Progress Analytics

- [ ] **Task 12.1**: Install charting library (recharts) and create base chart components
  - Spec: specs/07-progress-analytics.md
  - Acceptance: recharts installed, basic LineChart and BarChart wrappers created

- [ ] **Task 12.2**: Create analytics page at `/analytics` with date range selector
  - Spec: specs/07-progress-analytics.md
  - Acceptance: Page renders with selectable date ranges (4/8/12 weeks, all time)

- [ ] **Task 12.3**: Implement 1RM trend chart and volume tracking chart
  - Spec: specs/07-progress-analytics.md
  - Acceptance: Line chart shows estimated 1RM over time, bar chart shows weekly volume

- [ ] **Task 12.4**: Implement compliance rate and bodyweight trend charts
  - Spec: specs/07-progress-analytics.md
  - Acceptance: Compliance shows %, bodyweight shows trend line

- [ ] **Task 12.5**: Add CSV export for athlete training data
  - Spec: specs/07-progress-analytics.md
  - Acceptance: Download button generates CSV with date, exercise, sets, reps, weight, RPE

### Priority 13: VBT Analytics

- [ ] **Task 13.1**: Create load-velocity scatter chart component
  - Spec: specs/08-vbt-integration.md
  - Acceptance: Scatter plot of (weight, velocity) with linear regression trend line

- [ ] **Task 13.2**: Create velocity profile table and preparedness indicator
  - Spec: specs/08-vbt-integration.md
  - Acceptance: Table shows avg velocity at different %1RM, indicator compares to baseline

- [ ] **Task 13.3**: Add VBT section to analytics page
  - Spec: specs/08-vbt-integration.md
  - Acceptance: VBT charts render when velocity data exists, empty state otherwise

### Priority 14: Competition Prep

- [ ] **Task 14.1**: Create meet listing and creation pages at `/meets`
  - Spec: specs/09-competition-prep.md
  - Acceptance: List meets, create new meet with name/date/location/federation

- [ ] **Task 14.2**: Create meet detail page with athlete entries and attempt planning
  - Spec: specs/09-competition-prep.md
  - Acceptance: Add athletes, set planned attempts for SBD

- [ ] **Task 14.3**: Build warm-up timing calculator and countdown timer
  - Spec: specs/09-competition-prep.md
  - Acceptance: Input flight start time, generates warm-up schedule with countdown

- [ ] **Task 14.4**: Create multi-athlete flight tracking view
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
