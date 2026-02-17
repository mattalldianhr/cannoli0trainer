# Spec: Exercise Library with Videos

## Job to Be Done
Provide a searchable, customizable exercise database so the coach can quickly add exercises to programs with proper form references. Eliminates manually describing exercises or hunting for video links.

## Requirements
- Exercise library page at `/exercises`
- Create/edit exercise form
- Search exercises by name
- Filter by category (squat, bench, deadlift, accessory, warmup, etc.)
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
- [ ] Pre-seeded with 30+ powerlifting exercises on first run
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
