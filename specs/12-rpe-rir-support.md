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

## Technical Notes
- RPE and RIR fields already in SetLog and WorkoutExercise models
- RPE reference chart: static component, can be a popover or sheet
- RPE accuracy calculation: compare reported RPE to estimated RPE based on reps-at-weight vs. estimated 1RM
- This is primarily UI/UX work on top of existing schema
- RPE selector: custom slider or segmented control (not plain text input)
- Create `components/shared/RPESelector.tsx` reusable across program builder and training log
