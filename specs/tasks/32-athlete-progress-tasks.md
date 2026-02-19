# Task Group 32: Athlete Progress Dashboard

Spec: specs/15-athlete-progress-dashboard.md

### Priority 32: Athlete-Facing Progress Visibility

- [x] **Task 32.1**: Create athlete progress API endpoint
  - Spec: specs/15-athlete-progress-dashboard.md
  - Acceptance: `GET /api/athlete/progress?range=8w` returns `AthleteProgressData` shape: e1RM trends (keyed by exerciseId), weekly volume array, compliance (assigned/completed/streak), personal records list, bodyweight array (or null), available exercises. Endpoint validates authenticated session and scopes all queries to `athleteId` from session. Returns 401 if unauthenticated. Range param supports `4w`, `8w`, `12w`, `all`. Unit tested with mock Prisma data.

- [ ] **Task 32.2**: Build e1RM trend line chart for athlete progress page
  - Spec: specs/15-athlete-progress-dashboard.md
  - Acceptance: Recharts `LineChart` shows estimated 1RM over time for the selected exercise. Exercise selector dropdown defaults to Squat/Bench/Deadlift (competition lifts). Changing exercise updates the chart. Date range selector (4w/8w/12w/all) filters the data. Y-axis shows weight in athlete's unit. Empty state when no MaxSnapshot data exists for selected exercise. Reuses chart wrapper components from Spec 07 analytics.

- [ ] **Task 32.3**: Build weekly volume bar chart for athlete progress page
  - Spec: specs/15-athlete-progress-dashboard.md
  - Acceptance: Recharts `BarChart` shows weekly total tonnage (sum of weight x reps across all SetLogs per week). Current week bar highlighted with accent color. Shares the date range selector with the e1RM chart. Shows trend indicator (up/down arrow + percentage compared to previous equivalent period). Empty state when no workout data exists.

- [ ] **Task 32.4**: Build compliance ring and training streak display
  - Spec: specs/15-athlete-progress-dashboard.md
  - Acceptance: Donut/ring chart (SVG or recharts PieChart) showing compliance percentage (completed workouts / assigned workouts). Streak counter badge showing consecutive training days. Weekly and monthly compliance numbers displayed as secondary stats. Capped at 100% if athlete completes more than assigned. Empty state: "Complete your first assigned workout to start tracking."

- [ ] **Task 32.5**: Build personal records list component
  - Spec: specs/15-athlete-progress-dashboard.md
  - Acceptance: List of all-time best MaxSnapshot per exercise. Each row: exercise name, weight, reps, date achieved. Sorted most recent first. "New PR" badge (orange) on any record from the last 7 days. Filterable by category: competition lifts, variations, accessories, all. Empty state when no PR data exists. Tapping an exercise name could link to the e1RM chart for that exercise (nice-to-have).

- [ ] **Task 32.6**: Build bodyweight trend chart (conditional render)
  - Spec: specs/15-athlete-progress-dashboard.md
  - Acceptance: Recharts `LineChart` showing BodyweightLog entries over time. Current weight displayed as a badge/stat. Only renders if athlete has 2+ bodyweight entries. If fewer than 2 entries, shows prompt: "Log your bodyweight to see trends here" with link to bodyweight entry (if Task 31.6 exists). If athlete has a competition weight class, show horizontal target line on chart.

- [ ] **Task 32.7**: Assemble athlete progress page and update bottom navigation
  - Spec: specs/15-athlete-progress-dashboard.md
  - Acceptance: `/athlete/progress` page renders all chart sections in a mobile-optimized layout: e1RM chart at top (most prominent), volume chart, compliance + streak row, PR list, bodyweight chart (if data). Athlete bottom navigation updated from 4 tabs to 5 (add "Progress" with TrendingUp icon). Page loads via server component data fetch, passes to client chart components. Full-page empty state when athlete has zero training data. Responsive: single column on mobile, two-column grid on tablet+.
