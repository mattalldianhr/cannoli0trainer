# Spec: Athlete Self-Logging & Training Log

## Job to Be Done
Enable athletes to log their training (sets, reps, weight, RPE, velocity) via a mobile-friendly interface, eliminating the coach's need to chase athletes for training data and ending the "scattered across apps" problem.

## Requirements
- Athlete-facing workout view at `/train` (or `/athlete/train`)
- Shows today's assigned workout with all exercises and prescribed sets
- Athletes log each set: reps completed, weight used, RPE (optional), velocity (optional)
- Visual indicator of completed vs. remaining sets
- Previous performance shown for reference (last time this exercise was done)
- Timer between sets (optional, dismissable)
- Notes field per exercise for athlete comments
- Workout completion summary after all exercises logged
- Coach can view athlete's completed logs on athlete profile
- Mobile-first design (10/10 mobile importance)

## Acceptance Criteria
- [ ] Assigned workout displays with all exercises and prescriptions
- [ ] Each set has input fields for reps, weight, and optional RPE
- [ ] Completing a set marks it visually (checkmark, green highlight)
- [ ] Previous performance for the same exercise shown as reference
- [ ] Workout completion percentage updates in real-time
- [ ] "Complete Workout" button summarizes the session
- [ ] Logged data appears on athlete's profile in coach view
- [ ] Works well on 375px mobile viewport
- [ ] Offline-capable: queues logs if no connection (stretch goal)

## Test Cases
| Input | Expected Output |
|-------|-----------------|
| Athlete opens /train with assigned workout | Today's exercises shown with prescriptions |
| Log 3x5 at 225 lbs with RPE 7 | 3 sets saved, shown as completed |
| View set where last session was 3x5 at 215 | "Last: 215 lbs x 5" shown as reference |
| Complete all exercises | Summary card shows total volume, top RPE, etc. |
| No workout assigned today | "No workout scheduled" message |
| Mobile viewport 375px | Full logging interface usable with thumb |

## Technical Notes
- Client component with local state during active logging
- Save sets to database on each set completion (not just at end)
- SetLog model stores all fields
- Query previous performance: last SetLog for same exerciseId + athleteId
- Volume calculations: sum(reps * weight) per exercise and per session
- Use existing Progress component for workout completion bar
- Consider `useReducer` pattern matching existing `useInterview` hook
