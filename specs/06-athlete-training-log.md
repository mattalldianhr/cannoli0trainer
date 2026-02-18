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

## Deferred Features

### Rest Timer Between Sets
Optional start/stop/dismiss timer that appears after completing a set. Default duration configurable per exercise (falls back to WorkoutExercise.restTimeSeconds or a global default like 120s). UI: countdown overlay or inline timer with start, pause, reset, and dismiss controls. Plays an audio/vibration alert when timer expires. Does not block set logging — athlete can dismiss and log the next set at any time.

### Notes Field Per Exercise
Allow athletes to add free-text notes per exercise during a workout session. Notes are saved to the WorkoutExercise.notes field or to a per-set notes field on SetLog. The coach can view these notes on the athlete profile training log. UI: collapsible text area below the set logging grid for each exercise.

### Offline Queueing (Stretch Goal)
Queue set logs in localStorage if the device is offline. When connectivity returns, sync queued logs to the server. Use a simple queue: on set completion, if fetch fails, store the SetLog payload in localStorage with a timestamp. A background sync function checks the queue periodically and replays pending requests. Show a "pending sync" indicator to the athlete. This is a stretch goal — document the approach but deprioritize implementation.

## Revision History
- 2026-02-18: Added Deferred Features section (rest timer, exercise notes, offline queueing stretch goal) — spec update pass
