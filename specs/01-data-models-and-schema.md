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
- coachId (FK → Coach)
- name
- category (e.g., "squat", "bench", "deadlift", "accessory")
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
