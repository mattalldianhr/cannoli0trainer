# Schedule and Training Log

This guide covers the two pages you will use most often during training: the **Schedule** calendar at `/schedule` and the **Training Log** at `/train`. The schedule gives you a birds-eye view of every athlete's week, while the training log is where sets are actually recorded.

---

## Weekly Schedule Overview

The schedule page (`/schedule`) displays a Monday-through-Sunday calendar grid. Each row is an athlete; each column is a day of the week. The header row shows abbreviated day names (Mon, Tue, Wed, ...) with the calendar date below each one. Today's column is highlighted so you can orient yourself at a glance.

Above the grid you will see the date range for the displayed week (e.g., "Feb 16 - 22, 2026") and a count of total sessions scheduled that week.

Sessions appear as small cards inside each cell. A cell with no session shows a dash, indicating a rest day or unscheduled date. Athlete names in the left column link directly to the athlete profile page.

---

## Reading the Calendar

Each session card displays a status icon, the workout title, and an optional week/day label (e.g., "W2D3" for Week 2, Day 3 of the program).

### Status Icons and Colors

| Icon | Color | Meaning |
|------|-------|---------|
| Open circle | Gray border, muted background | **Not started** -- the athlete has not logged any sets yet |
| Clock | Amber border and background | **In progress** -- at least one set has been logged but the session is not complete |
| Filled check | Green border and background | **Completed** -- all prescribed sets have been logged |
| Ban/slash | Muted, reduced opacity | **Skipped** -- the coach explicitly skipped this session |

In-progress and completed sessions also display a percentage badge (e.g., "75%") next to the status icon showing how much of the session has been logged.

### Week Navigation

Use the left/right arrow buttons above the grid to move backward or forward one week at a time. When you navigate away from the current week, a "Today" button appears to jump back.

The URL updates with a `?week=` parameter as you navigate, so you can bookmark or share a link to a specific week.

---

## Moving Sessions

Schedules change. An athlete might miss a training day or you may want to swap two sessions. The schedule supports click-to-move for any session that has not been started.

### How to Move a Session

1. Find the session you want to move. It must have a "Not Started" status and must not be skipped.
2. Click the move icon (arrows) on the session card. A blue banner appears at the top confirming you are in move mode.
3. In the same athlete's row, click the target cell. If the cell is empty, the session moves there. If the cell has another not-started session, the two sessions swap dates.
4. The page refreshes to show the updated schedule.

To cancel a move, click the "Cancel" button in the blue banner.

Constraints:
- You can only move sessions within the same athlete's row.
- Sessions that are in progress or completed cannot be moved (the athlete has already logged work).
- Moved sessions are flagged as manually scheduled so you can tell they differ from the original program plan.

---

## Skipping Sessions

Sometimes a session should not happen at all -- the athlete is sick, traveling, or you are adjusting training volume. Skipping marks the session without deleting it.

### Skip vs. Move

- **Skip** when the session should not be made up. The workout stays on the calendar but appears grayed out with a strikethrough title.
- **Move** when the athlete will still do the workout, just on a different day.

### How to Skip

1. On a not-started session card, click the skip icon (forward arrow).
2. The session immediately shows as skipped.

### How to Undo a Skip

1. A skipped session displays an undo icon (curved arrow).
2. Click undo to restore the session to its original not-started state.

Skipping does not delete any data. The session record is preserved with an `isSkipped` flag so you have a complete history of schedule changes.

---

## Filtering

When you manage 30+ athletes, the full grid can be large. Use the athlete filter dropdown (next to the filter icon) above the calendar to narrow the view.

- **All Athletes** (default) shows every athlete with their session count.
- Select a specific athlete to show only their row.

The filter updates the URL with an `?athleteId=` parameter, so a filtered view can be bookmarked. Filtering and week navigation work together -- both parameters persist in the URL.

---

## Training Log

The training log page (`/train`) is where actual set data is recorded. In coach mode, it shows an athlete selector dropdown, a date picker, and the assigned workout for that athlete on that date.

### Athlete Selector

A dropdown at the top lists all athletes alphabetically. Select the athlete whose training you want to view or log. The page fetches their workout for the currently selected date.

### Date Picker

Next to the athlete selector, navigation arrows step forward or backward by one day. A date input shows the current date in the middle. A "Today" button appears whenever you navigate away from today's date.

### Assigned Exercises

When a workout session exists for the selected athlete and date, the page displays:

1. **Session header card** -- workout title, date, program name, status badge (Not Started / In Progress / Complete), and a progress bar showing completion percentage with counts of exercises completed, sets logged, and total volume.
2. **Exercise cards** -- one per exercise in the workout, listed in prescribed order.

Each exercise card shows:
- Exercise name with a completion icon (open circle or green check)
- Prescription summary (e.g., "4x5 @ 80%" or "3x8 @ RPE 7")
- Prescription type badge (e.g., "%1RM", "RPE", "RIR", "VBT")
- Superset grouping if applicable (colored left border and "SS: A" badge)
- Tempo and rest time when prescribed
- Coach notes for the exercise

Cards for completed exercises collapse by default to reduce clutter. Tap any card to expand or collapse it.

---

## Logging Sets

Each exercise card contains a set entry form at the bottom. The form shows which set number you are on (e.g., "Set 3 of 4").

### Input Fields

- **Weight (lbs)** -- numeric input for load. Pre-filled from the last logged set, previous performance, or prescribed load.
- **Reps** -- numeric input. Pre-filled from the prescription.
- **RPE** -- shown for RPE, RIR, or autoregulated prescriptions. Uses a selector widget. Optional.
- **Velocity (m/s)** -- shown for velocity-based training prescriptions. Optional.

### Logging a Set

1. Review or adjust the pre-filled values.
2. Click "Log Set N" (where N is the next set number).
3. The set appears above the form as a completed row with a green check: "Set 1: 225 lbs x 5 @ RPE 7".
4. The set number auto-increments and the form resets for the next set, keeping the same weight value.

### Editing and Deleting Sets

Hover over a logged set to reveal edit (pencil) and delete (trash) icons.

- **Edit**: Opens inline fields for weight, reps, RPE, and velocity. Click "Save" to commit changes or "Cancel" to discard.
- **Delete**: Click the trash icon, then confirm with the checkmark. The set is permanently removed and set numbers adjust accordingly.

---

## Previous Performance

Below each exercise name, the system shows the athlete's most recent performance for that same exercise. This appears as a line starting with a clock icon and "Last":

- When all previous sets had the same weight and reps: **Last (Feb 10): 3x5 @ 225 lbs RPE 7**
- When sets varied: individual entries separated by dots, e.g., **225 lbs x 5 . 235 lbs x 5 . 245 lbs x 3**

This gives both the coach and athlete an immediate reference point for loading decisions without switching pages.

---

## Session Completion

The progress bar on the session header card updates in real time as sets are logged.

### How Percentage is Calculated

Completion is based on exercises, not individual sets. An exercise is considered complete when the number of logged sets meets or exceeds the prescribed set count. The formula:

```
completion % = (completed exercises / total exercises) x 100
```

For example, if a workout has 5 exercises and 3 of them have all prescribed sets logged, completion is 60%.

The session header also displays:
- Exercise count (e.g., "3/5 exercises")
- Total sets logged across all exercises
- Total volume in lbs (sum of weight x reps for every logged set)

### Workout Complete Summary

When completion reaches 100%, a summary card appears at the bottom of the page with a trophy icon. It shows four stats in a grid: total exercises, total sets, total reps, and total volume. If any sets had an RPE recorded, the highest RPE is shown below the grid.

The session status badge in the header updates from "Not Started" through "In Progress" to "Complete" as logging progresses.

---

## Rest Days

When no workout session exists for the selected athlete and date, the training log shows a rest day screen:

- A dumbbell icon with the message "Rest Day" (for today) or "No workout scheduled" (for other dates).
- A note clarifying which athlete has no workout and for which date.
- If the system knows when the athlete's next session is, a link appears: "Next: Thursday, February 19 -- Heavy Squat Day". Clicking it jumps the date picker to that day.

On the schedule calendar, rest days appear as empty cells (a dash). They are visually distinct from skipped sessions, which show a card with the ban icon and strikethrough text. Rest days mean no session was ever scheduled; skipped days mean a session existed but was intentionally bypassed.
