# Spec: VBT Data Integration & Velocity Analytics

## Job to Be Done
Support the coach's VBT practice by storing velocity data, generating load-velocity profiles, tracking preparedness, and displaying velocity analytics. All velocity data is manual entry — VBT device API integrations are out of scope for the initial build.

## Requirements
- Velocity data stored per set (already in SetLog model)
- Manual velocity entry in athlete logging interface
- VBT analytics dashboard section (within analytics)
- Load-velocity curve generation per exercise per athlete
- Velocity profile: characteristic velocity at different percentages of 1RM
- Preparedness indicator: compare today's velocity to historical baseline
- Fatigue tracking: velocity loss within a session and across sessions
- Velocity targets in program prescription (already in schema)

## Acceptance Criteria
- [ ] Athletes can log velocity (m/s) per set in training log
- [ ] VBT section on analytics page shows velocity data
- [ ] Load-velocity scatter plot for selected exercise and athlete
- [ ] Linear regression line on load-velocity chart
- [ ] Velocity profile table showing avg velocity at 60%, 70%, 80%, 90% 1RM
- [ ] Preparedness indicator compares today's velocity to 4-week rolling average
- [ ] Fatigue metric: velocity drop from set 1 to final set within workout
- [ ] Velocity targets display in program builder prescriptions

## Test Cases
| Input | Expected Output |
|-------|-----------------|
| 10 squat sessions with velocity data | Load-velocity scatter plot with trend line |
| Today's squat velocity 0.05 m/s below baseline | Preparedness indicator shows "below baseline" |
| 5 sets: velocities [0.82, 0.78, 0.75, 0.71, 0.65] | Fatigue: 20.7% velocity drop |
| Prescribed velocity target 0.8 m/s | Training log shows target, athlete enters actual |
| Athlete with no velocity data | VBT section shows "No velocity data yet" |

## Technical Notes
- Velocity field already in SetLog model (optional float)
- Load-velocity curve: scatter plot of (weight, velocity) with linear regression
- Use least-squares regression for trend line calculation
- Preparedness: rolling 4-week average velocity at given load vs. today's reading
- Fatigue: ((set1_velocity - final_set_velocity) / set1_velocity) * 100
- This builds on top of the analytics spec — implement after base analytics
- Consider a `lib/vbt/` directory for velocity calculations
- Chart.js scatter plot or recharts scatter for load-velocity curve
