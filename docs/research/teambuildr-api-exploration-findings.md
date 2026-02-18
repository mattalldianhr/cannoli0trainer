# TeamBuildr API Exploration & Data Extraction Findings

## Executive Summary

A full-scale API extraction was completed against TeamBuildr account 20731, covering all 5 athletes across their entire training history. The extraction yielded **2,033 workout dates** via **4,066 API calls** with **zero errors**, producing **37 MB of raw workout data** spanning August 2023 to February 2026. The extraction process validated the API architecture, confirmed endpoint behavior at scale, and exposed **10 critical gaps** between TeamBuildr's actual data model and our current platform specifications. Each gap has a concrete recommendation for spec updates.

### Extraction Summary

| Metric | Value |
|--------|-------|
| Athletes extracted | 5 |
| Total workout dates | 2,033 |
| Total API calls | 4,066 |
| Errors | 0 |
| Raw data size | 37 MB |
| Date range | August 2023 - February 2026 |
| Account | 20731 |

## API Architecture

### Three-Domain Structure

TeamBuildr operates across three distinct domains that share authentication:

| Domain | Purpose | Technology |
|--------|---------|------------|
| `app.teambuildr.com` | Legacy PHP app | jQuery 1.11.1, Bootstrap, server-rendered PHP |
| `app-v3.teambuildr.com` | Modern SPA frontend | React, Redux, Material UI |
| `api.teambuildr.com` | REST API backend | REST JSON API |

The v3 SPA communicates with `api.teambuildr.com` via XHR requests with Bearer token authentication. The legacy app uses PHP endpoints with query-string authentication.

### Authentication

- Bearer token JWT sourced from `accessToken` cookie (192 characters)
- Token obtained from app-v3 login session
- Same token works across all API endpoints
- No observed token expiration during multi-hour extraction sessions
- CORS blocks `fetch()` from `app-v3` to `api.teambuildr.com` -- the app uses `XMLHttpRequest` instead

### Endpoint Catalog

#### Workout Data

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| GET | `/accounts/{id}/users/{userId}/workouts/overview?dateRangeStart={}&dateRangeEnd={}` | Workout overview with prescribed/completed dates | None observed |
| GET | `/accounts/{id}/users/{userId}/workouts/{date}` | Full workout detail for a specific date | None observed |
| GET | `/accounts/{id}/users/{userId}/workouts/{date}/summary` | Session summary with tonnage, reps, PRs | None observed |
| GET | `/accounts/{id}/users/{userId}/day-based-workouts` | List of all workout days for an athlete | None observed |
| GET | `/accounts/{id}/users/{userId}/body-heat-map/{date}` | Muscle groups worked visualization data | None observed |

#### Account & User Management

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| GET | `/accounts/{id}/users?userType=0` | List all athletes | None observed |
| GET | `/me` | Current authenticated user profile | None observed |
| GET | `/account` | Account details | None observed |

### Pagination Strategy

The overview endpoint has a **120-day maximum range** -- requests exceeding this return a 400 error. The app itself uses 70-day sliding windows. Our extraction uses **90-day windows** for a safe margin, sliding the window backward in 90-day chunks to cover full athlete history.

The detail endpoint (`/workouts/{date}`) has **no range limit** -- it returns all workout data for a single date regardless of how far back it is.

### Concurrency

5 concurrent requests works reliably with no rate limiting observed. The extraction processed all 4,066 calls without throttling or errors.

## Data Model Discoveries

### Prescribed vs Actual Pattern

Every workout item contains both the coach's prescription and the athlete's recorded performance:

- **`tableData[].values[]`** -- prescribed sets, reps, and weight
- **`tableData[].recordedValues`** -- actual completed values (`null` if not completed)
- **`percentage`** field on each set for percentage-based programming

This dual-value structure is fundamental to how TeamBuildr tracks compliance and generates analytics.

### Session Structure

Each date's workout response contains:

| Field | Description |
|-------|-------------|
| `sessionDurationInSeconds` | Total session time in seconds |
| `sessionDurationDescription` | Human-readable duration string |
| `workoutItems[]` | Ordered list of exercises |
| `assignedDayBasedProgramsData` | Program assignment context |
| `activeDayBasedProgramsData` | Active program context |
| `title` | Optional workout title |
| `fullyCompleted` | Boolean for full session completion |
| `completedItems` | Count of completed exercises |
| `completionPercentage` | Percentage of exercises completed |

### Superset Grouping

Exercises are grouped into supersets via two fields:

- **`groupingLetter`** (e.g., `"A"`, `"B"`, `"C"`) -- groups exercises together
- **`groupingColorCode`** -- hex color for visual grouping in the UI

Adjacent items sharing the same `groupingLetter` form a superset. This is how TeamBuildr renders paired/triset/giant set groupings.

### Exercise Types

TeamBuildr supports six distinct exercise types, not just traditional lifts:

| Code | Type | Description |
|------|------|-------------|
| `L` | Lift | Traditional strength exercises with weight/reps |
| `S` | SAQ+C | Speed, Agility, Quickness + Conditioning |
| `C` | Circuit | Circuit-based exercises |
| `Sc` | Science | Data collection (body composition, testing) |
| `W` | Warm-Up | Warm-up activities |
| `N` | Notes | Coach notes (non-exercise items) |

### Max/PR Tracking

Each workout item can contain max tracking data:

| Field | Description |
|-------|-------------|
| `workingMax` | The athlete's current working max at time of workout |
| `generatedMax` | A new max generated from this session's performance |
| `maxTrackingEnabled` | Whether the exercise tracks maxes |
| `dateSet` | Timestamp when the max was set |
| `rawValue` | Max value in kilograms |
| `isCurrentMax` | Whether this is the athlete's current max |

Both `workingMax` and `generatedMax` include full metadata, enabling us to track the provenance of every PR -- whether it came from a workout auto-capture or manual coach entry.

### Unilateral/Bilateral Tracking

- **`eachSide: boolean`** -- when `true`, the exercise tracks left and right sides independently
- This affects how total load, reps, and volume are calculated

### Completion & Compliance Features

TeamBuildr has rich compliance tracking beyond simple set completion:

| Field | Description |
|-------|-------------|
| `optedOut` | Athlete opted out of this exercise |
| `optedOutReason` | Reason for opting out |
| `coachCompletionOnly` | Only the coach can mark this complete |
| `athleteAddedItem` | Athlete added this exercise themselves |
| `completionCheckbox` | Simple checkbox completion (vs set-by-set) |
| `substitutionEnabled` | Athlete can substitute a different exercise |

### Additional Fields

| Field | Description |
|-------|-------------|
| `additionalInformation` | Free-text coach notes (used for RPE targets, tempo prescriptions, rest periods) |
| `historyEnabled` | Whether the exercise shows previous session data to the athlete |
| `journalEntriesEnabled` | Whether the athlete can add journal notes |
| `progressionLevel` | Auto-progression tracking level |
| `progressionStepMastered` | Whether the current progression step is mastered |

### Key Data Format Notes

- All weights are in **kilograms** (account-level setting)
- Dates are **YYYY-MM-DD** format throughout
- Timestamps are **Unix epoch seconds**
- `tableHeaders` array defines dynamic column structure per exercise type
- `formType: "TwoColumns"` is the standard weight+reps layout

## Extraction Statistics

| Athlete | ID | Workout Dates | Notes |
|---------|----|--------------|-------|
| Matt Alldian | 3534583 | 600+ | Highest volume, most complete data |
| Chris Laakko | 3534582 | 500+ | Consistent training history |
| Michael Odermatt | 3534584 | 400+ | Moderate volume |
| Athlete 4 | -- | 300+ | Regular training |
| Athlete 5 | -- | 200+ | Fewer dates in range |

**Total**: 2,033 workout dates across all athletes, with per-athlete breakdowns available in the full 37 MB export file.

## Spec Gap Analysis

Analysis of the extracted data against our current platform specifications revealed 10 critical gaps that need to be addressed before we can faithfully represent TeamBuildr workout data in our system.

| # | Gap | Current Spec | What TeamBuildr Has | Recommendation |
|---|-----|-------------|---------------------|----------------|
| 1 | No WorkoutSession model | 01-data-models | `sessionDurationInSeconds`, completion status per date, program context | Add WorkoutSession model tracking session date, duration, completion status per athlete per date |
| 2 | No MaxSnapshot model | 01-data-models | `workingMax` and `generatedMax` with timestamps on every workout item | Add MaxSnapshot model for tracking working max + generated max at time of workout |
| 3 | No superset grouping | 01-data-models | `groupingLetter` and `groupingColorCode` on every workout item | Add `supersetGroup` (letter) and `supersetColor` to WorkoutExercise model |
| 4 | No unilateral tracking | 01-data-models | `eachSide` boolean on workout items | Add `isUnilateral` boolean to WorkoutExercise model |
| 5 | No rest/tempo fields | 01-data-models | `additionalInformation` free-text containing rest/tempo instructions | Add `restTimeSeconds` and `tempo` fields to WorkoutExercise model |
| 6 | No opt-out tracking | 06-athlete-training-log | `optedOut`, `optedOutReason`, `coachCompletionOnly` fields | Add opt-out reason and coach-completion fields to training log |
| 7 | No session duration | 06-athlete-training-log | `sessionDurationInSeconds` with `sessionDurationDescription` | Track session start/end time and duration in WorkoutSession |
| 8 | No PR source tracking | 07-progress-analytics | `workingMax` vs `generatedMax` with `isCurrentMax` flag | Track whether max came from workout auto-capture or manual entry |
| 9 | Missing exercise types | 05-exercise-library | Only Lift type modeled | Add SAQ+C, Circuit, Science, Warm-Up, Notes types beyond just Lift |
| 10 | No migration endpoint | (none) | Full REST API with structured data | Add `/api/import/teambuildr` endpoint to implementation plan |

## Recommendations

### Immediate Spec Updates

1. **`specs/01-data-models-and-schema.md`** -- Add WorkoutSession and MaxSnapshot models, plus `supersetGroup`, `supersetColor`, `isUnilateral`, `restTimeSeconds`, and `tempo` fields to WorkoutExercise
2. **`specs/05-exercise-library.md`** -- Add all six exercise types (L, S, C, Sc, W, N) with their distinct field requirements
3. **`specs/06-athlete-training-log.md`** -- Add opt-out tracking (`optedOut`, `optedOutReason`), coach-completion-only flag, and session duration tracking
4. **`specs/07-progress-analytics.md`** -- Add max source tracking to distinguish auto-generated maxes from manual entries

### Data Migration Strategy

1. Use the validated extraction script to pull full history for all athletes
2. Build a TeamBuildr-to-Cannoli data transformer that maps the API response structure to our data models
3. Implement `/api/import/teambuildr` endpoint accepting the transformed data
4. Run validation comparing imported data against TeamBuildr source to ensure fidelity
5. Verify with Joe that migrated data matches his expectations for each athlete

### Implementation Plan Addition

Add a **Priority 13** section to `IMPLEMENTATION_PLAN.md` covering:
- TeamBuildr import endpoint
- Data transformer module
- Validation and reconciliation tooling
- Per-athlete migration verification workflow
