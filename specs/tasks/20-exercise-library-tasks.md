# Task Group 20: Exercise Library — Deferred Features

Source spec: specs/05-exercise-library.md

### Priority 20: Exercise Library Enhancements

- [ ] **Task 20.1**: Implement tag filter UI on exercise library page
  - Spec: specs/05-exercise-library.md
  - Acceptance: `/exercises` page has a tag filter alongside the existing category filter. Tags are loaded by querying distinct values from the Exercise.tags JSON array across all exercises. Filter renders as multi-select chips or a dropdown. Selecting one or more tags narrows the exercise list to only exercises containing all selected tags. Combines with category filter (AND logic). Clear button resets tag selection.

- [ ] **Task 20.2**: Implement edit exercise form
  - Spec: specs/05-exercise-library.md
  - Acceptance: Exercise detail view has an "Edit" button that opens the exercise form pre-populated with current values (name, category, video URL, coaching cues, tags, equipment, muscles). Submitting saves changes via PUT `/api/exercises/[id]`. Form component is shared with "Add Exercise" (reused with an `isEditing` prop or similar). Validation matches create form. Success redirects back to exercise detail with updated data.

- [ ] **Task 20.3**: Implement delete exercise with usage protection
  - Spec: specs/05-exercise-library.md
  - Acceptance: Exercise detail/edit view has a "Delete" button. Before deletion, the system checks WorkoutExercise records referencing this exercise. If referenced, shows a warning dialog: "This exercise is used in N workout(s) and cannot be deleted." with only a dismiss option. If unreferenced, shows a confirmation dialog: "Delete [exercise name]? This cannot be undone." On confirm, DELETE `/api/exercises/[id]` removes the exercise and redirects to `/exercises`.
