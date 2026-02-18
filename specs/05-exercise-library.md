# Spec: Exercise Library with Videos

## Job to Be Done
Provide a searchable, customizable exercise database so the coach can quickly add exercises to programs with proper form references. Eliminates manually describing exercises or hunting for video links.

## Requirements
- Exercise library page at `/exercises`
- Create/edit exercise form
- Search exercises by name
- Filter by category (strength, stretching, plyometrics, powerlifting, olympic weightlifting, strongman, cardio)
- Filter by tags (e.g., "lower body", "upper body", "competition lift", "variation")
- Each exercise: name, category, video URL (YouTube/Vimeo embed), coaching cues, tags
- Pre-seed with common powerlifting exercises (SBD + major accessories)
- Inline video preview on exercise detail
- Select exercise from library when building programs

## Acceptance Criteria
- [ ] `/exercises` page lists all exercises with search
- [ ] Category filter shows exercises in selected category
- [ ] Tag filter narrows results further
- [ ] "Add Exercise" form creates new exercise
- [ ] Exercise detail shows embedded video player if URL provided
- [ ] Coaching cues displayed below video
- [ ] Pre-seeded with 873 exercises from free-exercise-db on first run
- [ ] Exercise picker component reusable in program builder
- [ ] Edit and delete exercises with confirmation

## Test Cases
| Input | Expected Output |
|-------|-----------------|
| Search "squat" | Shows back squat, front squat, pause squat, etc. |
| Filter category "accessory" | Only accessories shown |
| Create "Larsen Press" with video URL | Exercise created, video playable |
| Open exercise picker in program builder | Modal/popover shows searchable exercise list |
| Delete unused exercise | Removed from library |
| Delete exercise used in a program | Warning shown, prevented or cascaded |

## Technical Notes
- Exercise model already defined in schema spec
- Use existing Input, Card, Badge components
- Video embed: use `<iframe>` for YouTube/Vimeo with responsive wrapper
- Seed script: create a `prisma/seed.ts` with common PL exercises
- Exercise picker should be a reusable component at `components/programs/ExercisePicker.tsx`
- Tags stored as JSON array in Exercise model

## Deferred Features

### Tag Filter UI
The spec mentions "Filter by tags" in requirements and acceptance criteria but no task was created for the UI. Add a tag filter component (multi-select chips or dropdown) alongside the existing category filter on `/exercises`. Tags are stored as a JSON array on the Exercise model — query distinct tags across all exercises to populate the filter options.

### Edit Exercise Form
Add an edit mode to the exercise detail view. Pre-populate the form with current values (name, category, video URL, coaching cues, tags). Save updates via PUT `/api/exercises/[id]`. Reuse the same form component as "Add Exercise" with an `isEditing` prop.

### Delete Exercise with Protection
Add a delete button on the exercise detail/edit view. Before deleting, check if the exercise is referenced by any WorkoutExercise records. If referenced, show a warning dialog explaining the exercise is used in N programs and cannot be deleted. If unreferenced, show a standard confirmation dialog and proceed with deletion.

## Revision History
- 2026-02-18: Added Deferred Features section (tag filter UI, edit exercise form, delete exercise with protection) — spec update pass
- 2026-02-17: Updated categories to match free-exercise-db taxonomy (strength/stretching/plyometrics/powerlifting/olympic weightlifting/strongman/cardio), updated seed count from 30+ to 873 — discovered during Task 2.1
