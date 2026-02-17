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

## Technical Notes
- Use a lightweight charting library (recharts or chart.js via react-chartjs-2)
- Add charting dependency to package.json
- 1RM estimation: Epley formula (weight * (1 + reps/30)) or Brzycki
- Aggregate queries in Prisma: group by week, sum volume
- Server component for data fetching, client component for interactive charts
- CSV export: generate on server, stream as download response
- Consider `/api/analytics/[athleteId]` endpoint for chart data
