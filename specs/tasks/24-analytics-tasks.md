# Task Group 24: Progress Analytics Enhancements

Spec: specs/07-progress-analytics.md

### Priority 24: RPE Analytics, Comparison View, Per-Athlete Embed

- [ ] **Task 24.1**: Build RPE distribution histogram and RPE accuracy metric
  - Spec: specs/07-progress-analytics.md
  - Acceptance: RPE distribution bar chart renders on analytics page showing set count per RPE bin (6-10 in 0.5 increments), filterable by exercise. RPE accuracy metric displays average absolute difference between reported RPE and estimated RPE (from rpe-table reverse lookup against MaxSnapshot e1RM). Empty state when no RPE data or no MaxSnapshot for exercise.

- [ ] **Task 24.2**: Build athlete comparison view (overlay 2-3 athletes on same chart)
  - Spec: specs/07-progress-analytics.md
  - Acceptance: Multi-select dropdown on analytics page allows selecting 2-3 athletes. 1RM trend chart renders overlaid color-coded lines per athlete. Legend shows athlete name + color. Works with existing date range selector. Max 3 athletes enforced in UI.

- [ ] **Task 24.3**: Embed per-athlete analytics on athlete profile page
  - Spec: specs/07-progress-analytics.md
  - Acceptance: `/athletes/[id]` page has "Analytics" tab or section showing 1RM trend, volume, and compliance charts pre-filtered to that athlete. Uses same chart components as `/analytics`. Link to full analytics page with athlete pre-selected.
