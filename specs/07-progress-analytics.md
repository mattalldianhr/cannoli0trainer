# Spec: Progress Analytics & Charts

## Job to Be Done
Fill the massive data gap the coach identified: provide long-term strength trends, volume tracking, compliance rates, RPE accuracy, and bodyweight tracking — all in one place. This is priority #2 after time savings.

## Requirements
- Analytics page at `/analytics` (coach view)
- Per-athlete analytics on athlete profile page
- Charts for:
  - Estimated 1RM trends over time (per lift)
  - Volume load tracking (sets x reps x weight per week)
  - Training compliance (assigned vs. completed workouts as %)
  - RPE distribution and accuracy over time
  - Bodyweight trend line
  - Lift-specific progress (e.g., squat progress over 12 weeks)
- Date range selector (last 4 weeks, 8 weeks, 12 weeks, all time)
- Export data as CSV (coach requested "flexibility of Google Sheets")
- Athlete comparison view (optional, for group context)

## Acceptance Criteria
- [ ] `/analytics` page renders with chart sections
- [ ] 1RM trend chart shows estimated max per lift over selected period
- [ ] Volume chart shows weekly tonnage (sets x reps x weight)
- [ ] Compliance rate shows percentage of assigned workouts completed
- [ ] Bodyweight chart shows trend with date range
- [ ] Date range selector updates all charts
- [ ] Per-athlete view accessible from athlete profile
- [ ] CSV export downloads training data for selected period
- [ ] Charts render on mobile viewport (responsive)
- [ ] Empty states for athletes with insufficient data

## Test Cases
| Input | Expected Output |
|-------|-----------------|
| Athlete with 12 weeks of squat data | Line chart showing 1RM progression |
| Select "Last 4 weeks" range | Charts filter to 4-week window |
| Athlete completed 18/20 workouts | Compliance shows 90% |
| Export CSV for athlete | Downloads file with date, exercise, sets, reps, weight, RPE |
| Athlete with no data | "Not enough data yet" message with guidance |
| Athlete with bodyweight logs | Bodyweight line chart rendered |

## Deferred Features (Phase 2)

### RPE Distribution Chart
Histogram showing frequency of reported RPE values over a configurable time range:
- X-axis: RPE values (6-10 in 0.5 increments)
- Y-axis: count of sets at each RPE
- Filterable by exercise or "all exercises"
- Helps coach identify if athlete is consistently under/over-rating effort

Implementation: Recharts `BarChart` with RPE bins. Query SetLog where `rpe IS NOT NULL` grouped by RPE value.

### RPE Accuracy Metric
Compare athlete's self-reported RPE to an estimated RPE derived from load/reps relative to known 1RM:
- Estimated RPE = reverse-lookup from RPE table using (weight / e1RM, reps)
- Accuracy = average absolute difference between reported and estimated RPE
- Display as a single number (e.g., "avg 0.5 RPE off") plus trend chart
- Requires athlete to have MaxSnapshot data for the exercise

Implementation: Use existing `src/lib/rpe-table.ts` for reverse lookup. Compute in `lib/analytics/rpe-accuracy.ts`.

### Athlete Comparison View
Overlay 2-3 athletes' progress on the same chart for group coaching context:
- Coach selects athletes via multi-select dropdown
- Overlays 1RM trend lines on same axes, color-coded per athlete
- Works with any chart type (1RM, volume, compliance)
- Max 3 athletes at once to keep chart readable

Implementation: Multi-series line chart in Recharts. API endpoint accepts array of athlete IDs. Distinct color palette per athlete.

### Per-Athlete Analytics (Profile Page Embed)
Embedded analytics view accessible from `/athletes/[id]` profile page:
- Tab or section on athlete profile showing their key charts
- Same chart components as `/analytics` but pre-filtered to single athlete
- Quick link from profile to full analytics page with athlete pre-selected

Implementation: Reuse chart components with `athleteId` prop. Add "Analytics" tab to athlete profile page layout.

## Technical Notes
- Use a lightweight charting library (recharts or chart.js via react-chartjs-2)
- Add charting dependency to package.json
- 1RM estimation: Epley formula (weight * (1 + reps/30)) or Brzycki
- Aggregate queries in Prisma: group by week, sum volume
- Server component for data fetching, client component for interactive charts
- CSV export: generate on server, stream as download response
- Consider `/api/analytics/[athleteId]` endpoint for chart data

## Revision History
| Date | Change |
|------|--------|
| 2026-02-18 | Added Deferred Features: RPE distribution chart, RPE accuracy metric, athlete comparison view, per-athlete analytics embed |
