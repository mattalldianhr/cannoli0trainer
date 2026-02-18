# Spec: RPE / RIR Prescription & Tracking Support

## Job to Be Done
Natively support RPE and RIR as first-class prescription methods throughout the platform — not afterthoughts — since the coach uses RPE-based progressive overload as a core periodization approach and wants to track RPE accuracy over time.

## Requirements
- RPE and RIR as selectable prescription types in program builder
- RPE/RIR input fields in athlete training log
- RPE scale reference (1-10 with descriptions) accessible during logging
- RPE history tracking: what RPE did athlete report vs. estimated effort
- RPE accuracy metric: how well athlete's RPE correlates with actual load progression
- Support RPE ranges (e.g., "RPE 7-8") not just single values
- RIR display (RIR = 10 - RPE for easy conversion)
- Autoregulated ranges: "Work up to RPE 8" as a prescription mode

## Acceptance Criteria
- [ ] Program builder shows RPE input when prescriptionType = "rpe"
- [ ] Supports RPE range input (e.g., "7-8")
- [ ] Program builder shows RIR input when prescriptionType = "rir"
- [ ] Training log has RPE selector (1-10 with 0.5 increments)
- [ ] RPE reference chart accessible via info icon during logging
- [ ] RPE history visible on athlete analytics
- [ ] RPE accuracy metric calculated (correlation between RPE and estimated effort)
- [ ] Autoregulated prescription displays "Work up to RPE X" format
- [ ] RIR automatically calculated and shown alongside RPE (10 - RPE)

## Test Cases
| Input | Expected Output |
|-------|-----------------|
| Prescribe "Squat 3x5 @ RPE 8" | Program shows RPE 8 prescription |
| Prescribe "Bench 4x3 @ 2 RIR" | Program shows 2 RIR (equivalent RPE 8) |
| Athlete logs RPE 7 on a set | SetLog stores rpe=7.0 |
| View RPE history for 8 weeks | Chart showing RPE distribution over time |
| Prescribe "Work up to RPE 8" | Shows autoregulated format, athlete logs ascending sets |
| RPE 8.5 entered | Accepted (0.5 increments supported) |

## Deferred Features (Phase 2)

### RPE History Chart on Athlete Analytics
Time-series chart showing RPE values per exercise over time:
- X-axis: date, Y-axis: RPE (6-10)
- Filter by exercise (dropdown)
- Show individual set RPEs as scatter points, with a trend line overlay
- Helps coach identify RPE drift (athlete consistently reporting lower/higher over time)

Implementation: Recharts scatter + line chart. Query SetLog where `rpe IS NOT NULL` for selected athlete and exercise, ordered by `completedAt`. Reuse analytics chart container.

### RPE Accuracy Metric
Quantify how well the athlete's self-reported RPE matches calculated effort:
- Estimated RPE = reverse lookup from RPE table using `(weight / e1RM, reps)`
- Requires MaxSnapshot for the exercise to derive e1RM
- Display: "Average RPE accuracy: +/- 0.5" with per-exercise breakdown
- Trend over time: is the athlete getting better at self-rating?

Implementation: Shared with Spec 07 analytics. `lib/analytics/rpe-accuracy.ts` exports `calculateRpeAccuracy(setLogs, maxSnapshots)`.

### Autoregulated Prescription Display
Display "Work up to RPE X, then backoff -Y%" as a formatted prescription in program builder and training log:
- Program builder: when `prescriptionType = autoregulated`, show two fields: target RPE and backoff percentage
- Training log: display as "Work up to RPE 8, then -10%" with clear visual formatting
- Athlete logs ascending sets until they hit target RPE, then logs backoff sets

Implementation: Conditional rendering in program builder exercise row. `WorkoutExercise` already has `prescribedRPE` and `prescribedLoad` fields — use `prescribedLoad` for backoff percentage when type is autoregulated.

### RIR Auto-Display Alongside RPE
Wherever RPE is shown, automatically display the equivalent RIR:
- Format: "RPE 8 / 2 RIR" displayed together
- Conversion: `RIR = 10 - RPE`
- Applies to: program builder prescription, training log display, analytics charts
- Half-increment support: RPE 8.5 = 1.5 RIR

Implementation: Utility function `rpeToRir(rpe: number): number` in `lib/rpe-table.ts`. UI helper component `RPEWithRIR` that renders both values.

## Technical Notes
- RPE and RIR fields already in SetLog and WorkoutExercise models
- RPE reference chart: static component, can be a popover or sheet
- RPE accuracy calculation: compare reported RPE to estimated RPE based on reps-at-weight vs. estimated 1RM
- This is primarily UI/UX work on top of existing schema
- RPE selector: custom slider or segmented control (not plain text input)
- Create `components/shared/RPESelector.tsx` reusable across program builder and training log

## Revision History
| Date | Change |
|------|--------|
| 2026-02-18 | Added Deferred Features: RPE history chart, RPE accuracy metric, autoregulated prescription display, RIR auto-display |
