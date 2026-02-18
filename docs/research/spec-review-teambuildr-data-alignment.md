# Spec Review: TeamBuildr Data Alignment

## Overview

Systematic review of all 12 technical specifications against real TeamBuildr API data extracted from account 20731. This review identifies gaps, confirms alignments, and provides specific field-level recommendations for each spec to ensure our platform can fully import and represent TeamBuildr workout data.

**Review methodology**: Each spec was compared against the actual JSON data structures returned by TeamBuildr's REST API, documented in the [API Exploration Findings](/research/teambuildr-api-exploration-findings).

## Spec-by-Spec Review

### Spec 01: Data Models & Schema

**Status**: Major updates needed

**Current gaps:**
1. **No WorkoutSession model** — TeamBuildr tracks per-date session data including `sessionDurationInSeconds`, completion percentage, and program context. We need a WorkoutSession model to represent a single athlete's workout on a given date.

2. **No MaxSnapshot model** — Every TeamBuildr workout item includes `workingMax` (athlete's max at time of workout) and `generatedMax` (new max from this session). We need MaxSnapshot to track these point-in-time values.

3. **Missing WorkoutExercise fields:**
   - `supersetGroup` (string, nullable) — from `groupingLetter` ("A", "B", "C")
   - `supersetColor` (string, nullable) — from `groupingColorCode` (hex color)
   - `isUnilateral` (boolean) — from `eachSide`
   - `restTimeSeconds` (integer, nullable) — parsed from `additionalInformation`
   - `tempo` (string, nullable) — parsed from `additionalInformation`

4. **Missing SetLog fields:**
   - `percentage` (float, nullable) — from set-level `percentage` field
   - `prescribed` values alongside `actual` values

**Recommended new models:**

```
WorkoutSession {
  id, athleteId, date, programId?, title?,
  durationSeconds?, completionPercentage,
  completedItems, totalItems, status (NOT_STARTED | PARTIALLY_COMPLETED | FULLY_COMPLETED),
  createdAt, updatedAt
}

MaxSnapshot {
  id, athleteId, exerciseId, date,
  workingMax, generatedMax?, isCurrentMax,
  source (WORKOUT | MANUAL | IMPORT),
  createdAt
}
```

### Spec 02: Coach Dashboard

**Status**: Minor updates needed

**Review:** Dashboard can display session duration and completion rates once WorkoutSession model exists. TeamBuildr's daily brief shows per-athlete status with color codes — our dashboard should support similar "at a glance" completion view.

**Recommendation:** Ensure dashboard queries aggregate WorkoutSession data for "today's activity" and "needs attention" sections.

### Spec 03: Athlete Management

**Status**: Aligned with minor additions

**Review:** TeamBuildr athlete profiles include `calendarAssignment` (program assignment with start/end dates, active/suspended status) and `groupAssignments` (named groups). Our spec handles athlete profiles but should ensure:
- Group assignment support (TeamBuildr uses named groups like "CMM Punk")
- Calendar/program assignment with date ranges
- Active/suspended/archived status transitions

**Recommendation:** Add `status` enum (ACTIVE | SUSPENDED | ARCHIVED) to Athlete model if not present.

### Spec 04: Program Builder

**Status**: Moderate updates needed

**Review:** TeamBuildr programs are calendar-based with day numbering. Key findings:
- Superset grouping via letter+color must be supported in the builder UI
- Percentage-based loading (`percentage` field on each set) is heavily used
- `assignedDayBasedProgramsData` and `activeDayBasedProgramsData` provide program context per workout

**Recommendation:** Ensure program builder supports:
1. Superset grouping with visual indicators (letters + colors)
2. Percentage-based prescription with `percentage` field per set
3. Day-based program structure matching TeamBuildr's calendar model

### Spec 05: Exercise Library

**Status**: Major updates needed

**Review:** TeamBuildr has 6 exercise types, not just lifts:
| Code | Type | Our Support |
|------|------|-------------|
| L | Lift | Supported |
| S | SAQ+C | Missing |
| C | Circuit | Missing |
| Sc | Science | Missing |
| W | Warm-Up | Missing |
| N | Notes | Missing |

Each exercise also has:
- `media` — video URL
- `description` — text description
- `trackingType` — determines how maxes are calculated
- `trackingTypeDescription` — human-readable tracking type

**Recommendation:** Add ExerciseType enum with all 6 types. Add `mediaUrl` and `trackingType` fields to Exercise model.

### Spec 06: Athlete Training Log

**Status**: Major updates needed

**Review:** TeamBuildr's training log includes several features we don't track:
1. **Session duration** — `sessionDurationInSeconds` with formatted description
2. **Opt-out** — `optedOut` boolean with `optedOutReason` text
3. **Coach completion** — `coachCompletionOnly` flag
4. **Athlete-added items** — `athleteAddedItem` flag for exercises the athlete added
5. **Exercise substitution** — `substitutionEnabled` flag
6. **Completion checkbox** — `completionCheckbox` for simple yes/no completion vs set tracking

**Recommendation:** Add to WorkoutExercise/SetLog:
- Opt-out fields (boolean + reason text)
- Coach-completion-only flag
- Athlete-added flag
- Support for checkbox-style completion (not just set-by-set)

### Spec 07: Progress Analytics

**Status**: Moderate updates needed

**Review:** TeamBuildr distinguishes between:
- `workingMax` — athlete's current max (may be manually set by coach)
- `generatedMax` — max auto-calculated from workout performance
- Both have `isCurrentMax` flag and timestamps

Session summaries include:
- `tonnage` — total volume load in kg
- `setsCompleted` / `repsCompleted` — aggregate counts
- `newPRs[]` — list of PRs set in this session with exercise names and values

**Recommendation:**
1. Track max source (WORKOUT vs MANUAL vs IMPORT) in MaxSnapshot
2. Add tonnage/volume analytics aggregation
3. Surface PR notifications from session summaries

### Spec 08: VBT Integration

**Status**: Aligned

**Review:** TeamBuildr supports `barSpeed` flag on exercises. Our VBT spec already covers velocity-based training. Field mapping is straightforward — verify that velocity data from TeamBuildr's `tableHeaders` (when `valueName` includes velocity) maps to our velocity fields.

**Recommendation:** No major changes needed. Ensure import transformer handles velocity column data when present.

### Spec 09: Competition Prep

**Status**: No changes needed

**Review:** TeamBuildr doesn't have meet/competition tracking. This is entirely new functionality for our platform. No data migration needed for this spec.

### Spec 10: Remote Program Delivery

**Status**: Minor review

**Review:** TeamBuildr has concept of "hidden workouts" (visibility toggle). Verify our remote delivery handles visibility controls.

**Recommendation:** Ensure program assignment has visibility toggle matching TeamBuildr's pattern.

### Spec 11: Template System

**Status**: Aligned with verification needed

**Review:** TeamBuildr uses calendar-based program containers with day numbering. Our template system should:
- Support converting day-based programs to templates
- Preserve day structure when creating programs from templates
- Handle the `assignedDayBasedProgramsData` structure

**Recommendation:** Verify template model preserves day-based structure from TeamBuildr programs.

### Spec 12: RPE/RIR Support

**Status**: Aligned with import consideration

**Review:** TeamBuildr stores RPE data in `additionalInformation` free-text field (e.g., "RPE 6, repeat for 2 more"). This is not structured data.

**Recommendation:** Build an `additionalInformation` parser that extracts RPE values when present (regex for "RPE X" pattern). Flag imported RPE data as "parsed from notes" vs "directly entered."

## Summary of Required Changes

| Spec | Priority | Changes |
|------|----------|---------|
| 01 - Data Models | Critical | Add WorkoutSession, MaxSnapshot models; add 5+ fields to WorkoutExercise |
| 05 - Exercise Library | Critical | Add 5 exercise types beyond Lift |
| 06 - Training Log | High | Add opt-out, coach-completion, session duration |
| 07 - Analytics | High | Add max source tracking, tonnage aggregation |
| 04 - Program Builder | Medium | Add superset UI, percentage-based sets |
| 03 - Athlete Management | Low | Add status enum, group support |
| 02 - Dashboard | Low | Ensure WorkoutSession aggregation queries |
| 12 - RPE/RIR | Low | Add `additionalInformation` parser |
| 08 - VBT | Low | Verify velocity field mapping |
| 10 - Remote Delivery | Low | Add visibility toggle |
| 11 - Templates | Low | Verify day-based structure |
| 09 - Competition | None | No TeamBuildr data to migrate |
