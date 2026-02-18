# Spec: Data Models & Database Schema

## Job to Be Done
Establish the foundational data architecture so all platform features have a consistent, well-typed persistence layer. The coach needs to manage athletes, programs, exercises, and training data — all in one place instead of scattered across apps.

## Requirements
- Extend Prisma schema with core domain models for the coaching platform
- Models must support the full coaching workflow: athletes, programs, workouts, exercises, sets, and performance data
- Support multiple load prescription methods (RPE, %1RM, RIR, velocity targets, autoregulated ranges, fixed weight)
- Store athlete profiles with training history, bodyweight tracking, and injury history
- Support competition/meet prep data (attempts, weight class, warmup timing)
- VBT data storage (velocity readings, load-velocity curves, velocity profiles)
- Coach profile linked to all athletes and programs
- JSON fields for flexible/extensible metadata where appropriate (following existing pattern from Submission model)

## Data Models

### Coach
- id (UUID, PK)
- name, email, brandName
- createdAt, updatedAt

### Athlete
- id (UUID, PK)
- coachId (FK → Coach)
- name, email
- bodyweight (optional)
- weightClass (optional)
- experienceLevel (enum: beginner, intermediate, advanced)
- isRemote (boolean)
- isCompetitor (boolean)
- federation (optional string, e.g., "USAPL")
- notes (text)
- metadata (JSON — extensible for injury history, preferences)
- createdAt, updatedAt

### Program
- id (UUID, PK)
- coachId (FK → Coach)
- name, description
- type (enum: individual, template, group)
- periodizationType (optional: block, dup, linear, rpe_based, hybrid)
- startDate, endDate (optional)
- isTemplate (boolean)
- createdAt, updatedAt

### ProgramAssignment
- id (UUID, PK)
- programId (FK → Program)
- athleteId (FK → Athlete)
- assignedAt, startDate, endDate (optional)

### Workout
- id (UUID, PK)
- programId (FK → Program)
- name (e.g., "Week 1 Day 1 - Heavy Squat")
- dayNumber, weekNumber (for ordering)
- notes (optional)
- createdAt, updatedAt

### Exercise
- id (UUID, PK)
- coachId (FK → Coach, optional — null for library exercises)
- name
- category (e.g., "strength", "stretching", "plyometrics", "powerlifting", "cardio")
- force (optional — "push", "pull", "static")
- level (optional — "beginner", "intermediate", "expert")
- mechanic (optional — "compound", "isolation")
- equipment (optional — "barbell", "dumbbell", "machine", etc.)
- primaryMuscles (JSON array)
- secondaryMuscles (JSON array)
- instructions (JSON array of strings)
- images (JSON array of filenames)
- videoUrl (optional)
- cues (optional text)
- tags (JSON array)
- createdAt, updatedAt

### WorkoutExercise
- id (UUID, PK)
- workoutId (FK → Workout)
- exerciseId (FK → Exercise)
- order (int)
- prescriptionType (enum: percentage, rpe, rir, velocity, autoregulated, fixed)
- prescribedSets, prescribedReps (string — supports ranges like "3-5")
- prescribedLoad (optional string — supports "%75", "RPE 8", "0.8 m/s", "185 lbs")
- prescribedRPE (optional float)
- prescribedRIR (optional int)
- velocityTarget (optional float, m/s)
- percentageOf1RM (optional float)
- supersetGroup (optional string — letter grouping, e.g., "A", "B")
- supersetColor (optional string — hex color code for UI grouping)
- isUnilateral (boolean, default false)
- restTimeSeconds (optional int)
- tempo (optional string — e.g., "3-1-0", "2-2-2")
- notes (optional)

### SetLog
- id (UUID, PK)
- workoutExerciseId (FK → WorkoutExercise)
- athleteId (FK → Athlete)
- setNumber (int)
- reps (int)
- weight (float)
- unit (enum: kg, lbs)
- rpe (optional float)
- rir (optional int)
- velocity (optional float, m/s)
- completedAt (DateTime)
- notes (optional)

### BodyweightLog
- id (UUID, PK)
- athleteId (FK → Athlete)
- weight (float)
- unit (enum: kg, lbs)
- loggedAt (DateTime)

### CompetitionMeet
- id (UUID, PK)
- coachId (FK → Coach)
- name (e.g., "2025 North Brooklyn Classic")
- federation, date, location
- createdAt, updatedAt

### MeetEntry
- id (UUID, PK)
- meetId (FK → CompetitionMeet)
- athleteId (FK → Athlete)
- weightClass
- squat1, squat2, squat3 (optional floats — attempts)
- bench1, bench2, bench3
- deadlift1, deadlift2, deadlift3
- openers (JSON — planned openers with notes)
- warmupPlan (JSON — timing and logistics)
- notes

### WorkoutSession
- id (UUID, PK)
- athleteId (FK → Athlete)
- date (Date)
- programId (FK → Program, optional)
- title (optional string)
- durationSeconds (optional int)
- completionPercentage (float, default 0)
- completedItems (int, default 0)
- totalItems (int, default 0)
- status (enum: NOT_STARTED, IN_PROGRESS, COMPLETED, PARTIAL)
- createdAt, updatedAt
- Unique constraint: [athleteId, date]

### MaxSnapshot
- id (UUID, PK)
- athleteId (FK → Athlete)
- exerciseId (FK → Exercise)
- date (DateTime)
- workingMax (float — the max the athlete is working off of)
- generatedMax (optional float — system-calculated max)
- isCurrentMax (boolean, default false)
- source (enum: WORKOUT, MANUAL, IMPORT)
- createdAt
- Indexes: [athleteId, exerciseId], [athleteId, date]

## Acceptance Criteria
- [ ] Prisma schema compiles without errors (`npx prisma validate`)
- [ ] Migration runs successfully (`npx prisma migrate dev`)
- [ ] Prisma client generates with all models (`npx prisma generate`)
- [ ] All relationships have proper foreign keys and cascade rules
- [ ] Enum types defined for prescriptionType, experienceLevel, unit
- [ ] Indexes on frequently queried fields (coachId, athleteId, programId)
- [ ] Schema supports all 6 load prescription methods the coach uses

## Test Cases
| Input | Expected Output |
|-------|-----------------|
| Create Coach → Create Athlete with coachId | Athlete linked to coach |
| Create Program → Create Workout → Create WorkoutExercise with RPE prescription | WorkoutExercise stores prescribedRPE |
| Create SetLog with velocity data | velocity field populated |
| Create BodyweightLog series | Can query bodyweight trend over time |
| Delete Coach | Cascades appropriately (or prevents if athletes exist) |

## Technical Notes
- Follow existing Prisma patterns from `prisma/schema.prisma` (UUID PKs, createdAt/updatedAt)
- Use `@default(uuid())` for IDs matching existing Submission model pattern
- Use JSON fields sparingly — only where schema truly needs to be flexible (metadata, openers, warmupPlan)
- Keep load prescription as explicit typed fields, not JSON, for queryability
- Add database indexes for coach→athlete and program→workout lookups

## Revision History
- 2026-02-17: Exercise model updated — coachId now optional (null for library exercises), added force/level/mechanic/equipment/primaryMuscles/secondaryMuscles/instructions/images fields, updated category examples to match free-exercise-db taxonomy — discovered during Task 2.1
- 2026-02-17: Added WorkoutSession and MaxSnapshot models (implemented in Task 1.9/1.10 but missing from spec). Added supersetGroup, supersetColor, isUnilateral, restTimeSeconds, tempo fields to WorkoutExercise (implemented in Task 1.10) — discovered during Task 2.3 review
