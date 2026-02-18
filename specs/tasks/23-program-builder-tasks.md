# Task Group 23: Program Builder Enhancements

Spec: specs/04-program-builder.md

### Priority 23: Program Overview, Notes, Auto-Save

- [ ] **Task 23.1**: Build program overview compact grid showing weekly structure at a glance
  - Spec: specs/04-program-builder.md
  - Acceptance: `ProgramOverview` component renders weeks as rows, days as columns. Each cell shows exercise count and key lift names. Clicking a cell navigates to that day's detail view. Works for programs with 1-16 weeks.

- [ ] **Task 23.2**: Surface notes fields at exercise, day, and program levels in the builder UI
  - Spec: specs/04-program-builder.md
  - Acceptance: Program description textarea visible in program header. Day-level notes textarea in each day section header. Exercise-level inline notes input below each exercise row. Note icon indicator shown when notes exist but field is collapsed. Notes persist to database on save.

- [ ] **Task 23.3**: Implement auto-save with dirty state tracking and save indicator
  - Spec: specs/04-program-builder.md
  - Acceptance: Changes debounce-save after 2s of inactivity. Header shows "Saving...", then "All changes saved" on success. `beforeunload` warns if unsaved changes exist. Dirty state tracked by comparing current data to last-saved snapshot.
