# Task Group 19: Athlete Management — Deferred Features

Source spec: specs/03-athlete-management.md

### Priority 19: Athlete Management Enhancements

- [ ] **Task 19.1**: Implement bulk program assignment for multiple athletes
  - Spec: specs/03-athlete-management.md
  - Acceptance: `/athletes` page has selectable checkboxes on each athlete row. A "Assign Program" bulk action button appears when 1+ athletes are selected. Clicking opens a program picker dialog. On confirm, ProgramAssignment records are created for all selected athletes. Success toast shows count of assignments created. Existing assignments for the same program are skipped (no duplicates).

- [ ] **Task 19.2**: Add bodyweight trend chart to athlete profile page
  - Spec: specs/03-athlete-management.md
  - Acceptance: `/athletes/[id]` profile page shows a line chart of bodyweight over time when BodyweightLog entries exist for the athlete. Chart uses recharts (already available) or a lightweight chart library. X-axis is date, Y-axis is weight with unit label. Chart is hidden when no bodyweight data exists. Displays the most recent 90 days by default with option to expand range.

- [ ] **Task 19.3**: Add per-athlete analytics link on athlete profile
  - Spec: specs/03-athlete-management.md
  - Acceptance: `/athletes/[id]` profile page includes a "View Analytics" button/link that navigates to `/analytics?athleteId=[id]`. The analytics page reads the `athleteId` query param and pre-filters all charts/data to that athlete. Button uses lucide-react `BarChart3` or similar icon.
