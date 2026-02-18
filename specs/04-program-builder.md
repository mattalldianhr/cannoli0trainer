# Spec: Program Builder / Workout Designer

## Job to Be Done
Enable the coach to build training programs with the "flexibility of Google Sheets combined with the management capabilities of TeamBuildr." This is the #1 priority — saving 10-15 hours/week on programming by supporting all 6 load prescription methods and 4 periodization approaches the coach uses.

## Requirements
- Program builder page at `/programs/new` and `/programs/[id]/edit`
- Program listing page at `/programs`
- Support creating programs from scratch or from templates
- Multi-week program structure: weeks → days → exercises → sets
- Each exercise prescription supports ALL methods:
  - Percentage of 1RM (e.g., "75%")
  - RPE (e.g., "RPE 8")
  - RIR (e.g., "2 RIR")
  - Velocity targets (e.g., "0.8 m/s")
  - Autoregulated ranges (e.g., "Work up to RPE 8, then -10%")
  - Fixed weight / progressive overload (e.g., "185 lbs")
- Copy/duplicate weeks, days, and individual exercises
- Reorder exercises via drag or move buttons
- Save program as template for reuse
- Assign program to one or multiple athletes
- Program overview showing weekly structure at a glance
- Notes field per exercise, per day, and per program

## Acceptance Criteria
- [ ] `/programs` lists all programs and templates
- [ ] "New Program" creates a blank program with name and description
- [ ] Can add weeks and days to a program
- [ ] Can add exercises to a day from exercise library
- [ ] Each exercise supports selecting prescription type from dropdown
- [ ] Prescription type selection shows appropriate input fields
- [ ] Can duplicate a week (copies all days and exercises)
- [ ] Can duplicate a day (copies all exercises)
- [ ] Can reorder exercises within a day
- [ ] "Save as Template" creates a reusable copy
- [ ] "Assign to Athlete" links program to selected athlete(s)
- [ ] Program overview shows compact week/day/exercise grid
- [ ] All changes auto-save or save on explicit action
- [ ] DEALBREAKER TEST: Can create a block periodization program with RPE-based squat, percentage-based bench, and velocity-target deadlift in the same workout

## Test Cases
| Input | Expected Output |
|-------|-----------------|
| Create 4-week block program | 4 weeks visible, each expandable to days |
| Add "Back Squat" with RPE 7-8 | Exercise shows "RPE 7-8" in prescription |
| Add "Bench Press" at 80% 1RM | Exercise shows "80%" in prescription |
| Add "Deadlift" at 0.75 m/s velocity | Exercise shows "0.75 m/s" velocity target |
| Duplicate Week 1 to Week 2 | Week 2 created with identical structure |
| Save as template | Appears in template list, original unchanged |
| Assign to 3 athletes | ProgramAssignment created for each |
| Mixed prescription in single day | All 6 types render correctly side by side |

## Deferred Features (Phase 2)

### Program Overview — Weekly Structure at a Glance
A compact grid/table view showing the entire program structure without expanding each week:
- Rows = weeks, columns = days
- Each cell shows exercise count and key lifts (e.g., "4 exercises: Squat, Bench")
- Click a cell to jump to that day's detail view
- Useful for reviewing multi-week block periodization at a glance

Implementation: Rendered as a `<table>` or CSS grid in `components/programs/ProgramOverview.tsx`. Server component fetching program with all nested relations.

### Notes Fields (Exercise, Day, Program Level)
Rich-text-free notes at three levels:
- **Program-level notes**: Already supported via `Program.description` — enhance UI to make it prominent
- **Day-level notes**: Already in `Workout.notes` — add visible textarea in day header
- **Exercise-level notes**: Already in `WorkoutExercise.notes` — add inline note input below each exercise row

Implementation: Plain `<textarea>` inputs with auto-resize. Notes save alongside the parent entity. Show note icon indicator when notes exist but are collapsed.

### Auto-Save Indicator / Dirty State Tracking
Track unsaved changes and provide clear save feedback:
- "Saving..." indicator when auto-save triggers (debounced 2s after last change)
- "All changes saved" confirmation text
- "Unsaved changes" warning before navigation (via `beforeunload` event)
- Dirty state tracked via React state comparing current form data to last-saved snapshot

Implementation: Custom `useDirtyState` hook. Auto-save via `useDebouncedCallback`. Visual indicator component in program builder header bar.

## Technical Notes
- This is the most complex feature — break into sub-tasks in implementation plan
- Program builder should be a client component (heavy interactivity)
- Consider local state during editing, save to DB on explicit action
- Exercise library search with existing Exercise model
- Use Radix UI Select/Dropdown for prescription type
- Prescription fields conditionally render based on selected type
- Follow existing pattern of typed interfaces in `lib/` directory
- Create `lib/programs/types.ts` for program builder types
- Consider optimistic UI updates for responsiveness

## Revision History
| Date | Change |
|------|--------|
| 2026-02-18 | Added Deferred Features: program overview grid, notes fields detail, auto-save with dirty state |
