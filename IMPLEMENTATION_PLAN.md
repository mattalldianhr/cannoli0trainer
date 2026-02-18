# Implementation Plan

## Status
- Total tasks: 66
- Completed: 5
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

- [ ] **Task 1.5**: Create SetLog model with all tracking fields (reps, weight, RPE, RIR, velocity)
  - Spec: specs/01-data-models-and-schema.md
  - Acceptance: `npx prisma validate` passes, SetLog supports all 6 prescription methods

- [ ] **Task 1.6**: Create BodyweightLog, CompetitionMeet, and MeetEntry models
  - Spec: specs/01-data-models-and-schema.md
  - Acceptance: `npx prisma validate` passes, meet models have proper relations

- [ ] **Task 1.7**: Add database indexes on coachId, athleteId, programId, workoutId foreign keys
  - Spec: specs/01-data-models-and-schema.md
  - Acceptance: `npx prisma validate` passes, indexes defined on FK columns

- [ ] **Task 1.8**: Run Prisma migration to create all tables
  - Spec: specs/01-data-models-and-schema.md
  - Acceptance: `npx prisma migrate dev --name init-platform-models` succeeds

- [ ] **Task 1.9**: Create seed script with 30+ common powerlifting exercises
  - Spec: specs/05-exercise-library.md
  - Acceptance: `npx prisma db seed` creates exercises (SBD + accessories)

### Priority 2: Core API Routes

- [ ] **Task 2.1**: Create CRUD API routes for Coach (`/api/coaches`)
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: POST creates coach, GET returns coach profile

- [ ] **Task 2.2**: Create CRUD API routes for Athletes (`/api/athletes`, `/api/athletes/[id]`)
  - Spec: specs/03-athlete-management.md
  - Acceptance: POST/GET/PUT/DELETE work, GET supports search query param

- [ ] **Task 2.3**: Create CRUD API routes for Programs (`/api/programs`, `/api/programs/[id]`)
  - Spec: specs/04-program-builder.md
  - Acceptance: POST/GET/PUT/DELETE work, includes nested workout/exercise data

- [ ] **Task 2.4**: Create CRUD API routes for Exercises (`/api/exercises`)
  - Spec: specs/05-exercise-library.md
  - Acceptance: POST/GET/PUT/DELETE work, GET supports search and category filter

- [ ] **Task 2.5**: Create API routes for SetLog entries (`/api/sets`)
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: POST creates set log, GET returns sets for athlete+exercise

- [ ] **Task 2.6**: Create API routes for BodyweightLog (`/api/bodyweight`)
  - Spec: specs/07-progress-analytics.md
  - Acceptance: POST creates log, GET returns history for athlete

- [ ] **Task 2.7**: Create API routes for Meets (`/api/meets`, `/api/meets/[id]`)
  - Spec: specs/09-competition-prep.md
  - Acceptance: POST/GET/PUT work, includes meet entries with athlete data

- [ ] **Task 2.8**: Create program assignment API (`/api/programs/[id]/assign`)
  - Spec: specs/04-program-builder.md
  - Acceptance: POST assigns program to athlete(s), creates ProgramAssignment records

- [ ] **Task 2.9**: Create analytics data API (`/api/analytics/[athleteId]`)
  - Spec: specs/07-progress-analytics.md
  - Acceptance: GET returns aggregated data (1RM trends, volume, compliance) for date range

### Priority 3: Core UI - Athlete Management

- [ ] **Task 3.1**: Create athlete listing page at `/athletes` with search and filter
  - Spec: specs/03-athlete-management.md
  - Acceptance: Page renders athlete list, search filters by name, filter chips work

- [ ] **Task 3.2**: Create "Add Athlete" form with validation
  - Spec: specs/03-athlete-management.md
  - Acceptance: Form creates athlete via API, validates required fields

- [ ] **Task 3.3**: Create athlete profile page at `/athletes/[id]` with tabs for info, training, analytics
  - Spec: specs/03-athlete-management.md
  - Acceptance: Profile shows athlete data, current program, recent training

- [ ] **Task 3.4**: Add edit and delete functionality to athlete profile
  - Spec: specs/03-athlete-management.md
  - Acceptance: Edit saves changes, delete shows confirmation then removes

### Priority 4: Core UI - Exercise Library

- [ ] **Task 4.1**: Create exercise library page at `/exercises` with search and category filter
  - Spec: specs/05-exercise-library.md
  - Acceptance: Page lists exercises, search and filter work

- [ ] **Task 4.2**: Create "Add Exercise" form with name, category, video URL, cues, tags
  - Spec: specs/05-exercise-library.md
  - Acceptance: Form creates exercise, video URL renders embed preview

- [ ] **Task 4.3**: Create reusable ExercisePicker component for program builder
  - Spec: specs/05-exercise-library.md
  - Acceptance: Modal/popover with search, selecting exercise returns exercise data

### Priority 5: Core UI - Program Builder

- [ ] **Task 5.1**: Create program listing page at `/programs` showing programs and templates
  - Spec: specs/04-program-builder.md
  - Acceptance: Page lists programs with name, athlete count, duration, type

- [ ] **Task 5.2**: Create program builder types in `lib/programs/types.ts`
  - Spec: specs/04-program-builder.md
  - Acceptance: TypeScript interfaces for program editing state compile without errors

- [ ] **Task 5.3**: Create program builder page at `/programs/new` with week/day structure
  - Spec: specs/04-program-builder.md
  - Acceptance: Can create program, add weeks, add days within weeks

- [ ] **Task 5.4**: Add exercise addition to program builder with prescription type selector
  - Spec: specs/04-program-builder.md
  - Acceptance: Can add exercise from library, select prescription type, enter prescription values

- [ ] **Task 5.5**: Implement prescription type conditional fields (RPE, %1RM, RIR, velocity, auto, fixed)
  - Spec: specs/04-program-builder.md, specs/12-rpe-rir-support.md
  - Acceptance: All 6 prescription types show correct input fields

- [ ] **Task 5.6**: Add week/day/exercise duplication in program builder
  - Spec: specs/04-program-builder.md
  - Acceptance: Duplicate week copies all days/exercises, duplicate day copies exercises

- [ ] **Task 5.7**: Add exercise reordering within a day
  - Spec: specs/04-program-builder.md
  - Acceptance: Move up/down buttons change exercise order

- [ ] **Task 5.8**: Implement program save (create/update) to database via API
  - Spec: specs/04-program-builder.md
  - Acceptance: Saving program persists all weeks/days/exercises to database

- [ ] **Task 5.9**: Add "Assign to Athlete" flow on program page
  - Spec: specs/04-program-builder.md
  - Acceptance: Select athletes from list, assign creates ProgramAssignment records

### Priority 6: Template System

- [ ] **Task 6.1**: Add "Save as Template" button to program builder
  - Spec: specs/11-template-system.md
  - Acceptance: Creates template copy of program (isTemplate=true, no athlete loads)

- [ ] **Task 6.2**: Create template listing page at `/programs/templates`
  - Spec: specs/11-template-system.md
  - Acceptance: Lists templates with metadata, search, and filter by periodization type

- [ ] **Task 6.3**: Add "Create from Template" flow
  - Spec: specs/11-template-system.md
  - Acceptance: Creates new program from template structure without athlete-specific loads

### Priority 7: RPE/RIR Support Components

- [ ] **Task 7.1**: Create RPESelector component with 1-10 scale (0.5 increments)
  - Spec: specs/12-rpe-rir-support.md
  - Acceptance: Component renders scale, supports selection, shows RPE descriptions

- [ ] **Task 7.2**: Create RPE reference chart popover component
  - Spec: specs/12-rpe-rir-support.md
  - Acceptance: Info icon opens popover showing RPE 1-10 with descriptions

### Priority 8: Athlete Training Log

- [ ] **Task 8.1**: Create training log page at `/train` showing today's workout
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: Displays assigned exercises with prescriptions, mobile-optimized

- [ ] **Task 8.2**: Implement set logging interface with reps, weight, RPE, velocity inputs
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: Each set has input fields, completing set saves to database

- [ ] **Task 8.3**: Add previous performance reference per exercise
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: Shows "Last: X lbs x Y reps" from most recent session

- [ ] **Task 8.4**: Add workout completion summary card
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: After all exercises, shows total volume, sets, top RPE

### Priority 9: Coach Dashboard

- [ ] **Task 9.1**: Create dashboard page at `/dashboard` with overview stat cards
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: Shows total athletes, active programs, workouts this week

- [ ] **Task 9.2**: Add recent activity feed to dashboard
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: Shows last 7 days of athlete training logs grouped by day

- [ ] **Task 9.3**: Add "Needs Attention" section flagging inactive athletes
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: Shows athletes with no logs in 3+ days

- [ ] **Task 9.4**: Add upcoming meets section to dashboard
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: Shows meets in next 30 days with athlete count

- [ ] **Task 9.5**: Update Header nav to include Dashboard, Athletes, Programs, Exercises links
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: Nav links route to correct pages, active state shown
  - Note: Current Header has research hub links (Home, Research, Interview, Submissions, Findings, PRD). Must replace or restructure for coaching platform nav.

### Priority 10: Progress Analytics

- [ ] **Task 10.1**: Install charting library (recharts) and create base chart components
  - Spec: specs/07-progress-analytics.md
  - Acceptance: recharts installed, basic LineChart and BarChart wrappers created

- [ ] **Task 10.2**: Create analytics page at `/analytics` with date range selector
  - Spec: specs/07-progress-analytics.md
  - Acceptance: Page renders with selectable date ranges (4/8/12 weeks, all time)

- [ ] **Task 10.3**: Implement 1RM trend chart and volume tracking chart
  - Spec: specs/07-progress-analytics.md
  - Acceptance: Line chart shows estimated 1RM over time, bar chart shows weekly volume

- [ ] **Task 10.4**: Implement compliance rate and bodyweight trend charts
  - Spec: specs/07-progress-analytics.md
  - Acceptance: Compliance shows %, bodyweight shows trend line

- [ ] **Task 10.5**: Add CSV export for athlete training data
  - Spec: specs/07-progress-analytics.md
  - Acceptance: Download button generates CSV with date, exercise, sets, reps, weight, RPE

### Priority 11: VBT Analytics

- [ ] **Task 11.1**: Create load-velocity scatter chart component
  - Spec: specs/08-vbt-integration.md
  - Acceptance: Scatter plot of (weight, velocity) with linear regression trend line

- [ ] **Task 11.2**: Create velocity profile table and preparedness indicator
  - Spec: specs/08-vbt-integration.md
  - Acceptance: Table shows avg velocity at different %1RM, indicator compares to baseline

- [ ] **Task 11.3**: Add VBT section to analytics page
  - Spec: specs/08-vbt-integration.md
  - Acceptance: VBT charts render when velocity data exists, empty state otherwise

### Priority 12: Competition Prep

- [ ] **Task 12.1**: Create meet listing and creation pages at `/meets`
  - Spec: specs/09-competition-prep.md
  - Acceptance: List meets, create new meet with name/date/location/federation

- [ ] **Task 12.2**: Create meet detail page with athlete entries and attempt planning
  - Spec: specs/09-competition-prep.md
  - Acceptance: Add athletes, set planned attempts for SBD

- [ ] **Task 12.3**: Build warm-up timing calculator and countdown timer
  - Spec: specs/09-competition-prep.md
  - Acceptance: Input flight start time, generates warm-up schedule with countdown

- [ ] **Task 12.4**: Create multi-athlete flight tracking view
  - Spec: specs/09-competition-prep.md
  - Acceptance: Grid shows all athletes' warm-up progress in a single view

### Priority 13: Data Migration

- [ ] **Task 13.1**: Add WorkoutSession and MaxSnapshot models to Prisma schema
  - Spec: specs/01-data-models-and-schema.md
  - Acceptance: `npx prisma validate` passes, both models have proper relations and indexes

- [ ] **Task 13.2**: Add superset, unilateral, rest, tempo fields to WorkoutExercise model
  - Spec: specs/01-data-models-and-schema.md
  - Acceptance: `npx prisma validate` passes, WorkoutExercise has supersetGroup, supersetColor, isUnilateral, restTimeSeconds, tempo fields

- [ ] **Task 13.3**: Create `/api/import/teambuildr` endpoint for bulk data migration
  - Spec: summaries/teambuildr-api-exploration-findings.md
  - Acceptance: POST endpoint accepts TeamBuildr JSON export, creates WorkoutSessions, WorkoutExercises, SetLogs, MaxSnapshots

- [ ] **Task 13.4**: Build TeamBuildr data transformer (TeamBuildr schema -> Cannoli schema)
  - Spec: summaries/teambuildr-api-exploration-findings.md
  - Acceptance: Transforms all exercise types, handles prescribed vs actual values, maps superset grouping, extracts RPE from additionalInformation

- [ ] **Task 13.5**: Create migration validation script to verify import completeness
  - Spec: summaries/spec-review-teambuildr-data-alignment.md
  - Acceptance: Script compares source TeamBuildr data counts against imported database records, reports discrepancies

- [x] **Task 13.6**: Create production TeamBuildr export script with rate limiting and resume
  - Spec: summaries/teambuildr-api-exploration-findings.md
  - Acceptance: `npx tsx scripts/teambuildr-export.ts --help` prints usage, supports --token, --account, --output, --resume flags
  - **Completed**: Full implementation exists at `scripts/teambuildr-export.ts` with supporting libraries in `scripts/lib/` (teambuildr-client, rate-limiter, retry, checkpoint, logger). Supports --token, --account, --output, --resume, --athletes, --concurrency, --rate flags.

## Discoveries

_Updated by Ralph during planning review (2026-02-17)_

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
