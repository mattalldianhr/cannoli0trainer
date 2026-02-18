# Spec: Athlete Progress Dashboard

## Job to Be Done
Give athletes visibility into their own training progress directly within the app — eliminating the current blind spot where athletes can log workouts but never see how they're improving. This fulfills the PRD must-have requirement that athletes "view workouts, log training, **see progress**" and addresses the single biggest gap identified across all research documents: every competitor (TrueCoach, TrainHeroic, BridgeAthletic, Volt, CoachMePlus) provides athletes with self-service progress visibility, and we currently do not.

## Context
- Spec 07 (Progress Analytics) builds coach-facing analytics at `/analytics`
- Spec 10 (Remote Program Delivery) defines the athlete portal at `/athlete/*` with 4 tabs: Dashboard, Train, Calendar, History
- This spec adds a 5th tab: **Progress** at `/athlete/progress`
- Chart components from Spec 07 (recharts-based) are reusable with athlete-scoped data
- The athlete must be authenticated (Spec 10, NextAuth) to see their own data only

## Requirements
- New page at `/athlete/progress` accessible from athlete bottom navigation (5th tab)
- All data scoped to the authenticated athlete — no access to other athletes' data
- Charts and metrics reuse the same recharts components from Spec 07 where possible
- Mobile-first design (primary use case is athletes checking progress on their phone)

### Charts & Metrics

1. **Estimated 1RM Trends** (primary chart)
   - Line chart showing estimated 1RM over time for selected exercise
   - Exercise selector dropdown (default to competition lifts: Squat, Bench, Deadlift)
   - Data source: MaxSnapshot records + SetLog-derived e1RM (Epley formula)
   - Date range selector: 4 weeks, 8 weeks, 12 weeks, all time
   - Axis labels: date (X), weight in athlete's preferred unit (Y)

2. **Training Volume**
   - Bar chart showing weekly total tonnage (sets x reps x weight)
   - Grouped by week, current week highlighted
   - Same date range selector as 1RM chart
   - Shows trend direction (up/down arrow compared to previous period)

3. **Training Streak & Compliance**
   - Current streak: consecutive days with at least one logged workout
   - Weekly compliance: workouts completed vs. workouts assigned (as percentage)
   - Monthly compliance: same but over trailing 30 days
   - Visual: ring/donut chart for compliance percentage + streak counter badge

4. **Personal Records**
   - List of all-time PRs per exercise (from MaxSnapshot records)
   - Shows: exercise name, best weight, reps at that weight, date achieved
   - Sorted by most recent first (highlights recent achievements)
   - "New PR" badge on any record set in the last 7 days
   - Filterable by exercise category (competition lifts, variations, accessories)

5. **Bodyweight Trend** (if data exists)
   - Line chart showing bodyweight over time from BodyweightLog records
   - Current weight badge prominently displayed
   - Target weight class line (if athlete has a competition weight class set)
   - Only renders if athlete has 2+ bodyweight entries; otherwise shows "Log your bodyweight to see trends" prompt

## Acceptance Criteria
- [ ] `/athlete/progress` page renders with all chart sections
- [ ] 1RM trend chart shows data from MaxSnapshot + SetLog for selected exercise
- [ ] Exercise dropdown defaults to competition lifts (squat, bench, deadlift)
- [ ] Volume chart shows weekly tonnage as bar chart
- [ ] Compliance shows ring chart with percentage and streak count
- [ ] Personal records list shows all-time bests with dates
- [ ] "New PR" badge appears on records from the last 7 days
- [ ] Bodyweight chart renders when 2+ entries exist
- [ ] Empty states shown for each section when insufficient data exists
- [ ] Date range selector updates 1RM and volume charts
- [ ] All data scoped to authenticated athlete only (no cross-athlete data leakage)
- [ ] Page is mobile-optimized (375px viewport, large touch targets)
- [ ] Bottom navigation updated to show 5 tabs (Dashboard, Train, Calendar, History, Progress)

## Test Cases
| Input | Expected Output |
|-------|-----------------|
| Athlete with 12 weeks of squat data | 1RM trend line showing progression |
| Athlete selects "Bench Press" from dropdown | Chart updates to show bench 1RM trend |
| Athlete with 5 workouts this week (3 assigned) | Compliance ring shows "100%" (5/3 capped at 100%) or "5 completed" |
| Athlete hit a new squat PR 3 days ago | PR list shows squat first with "New PR" badge |
| Athlete with no bodyweight logs | Bodyweight section shows CTA: "Log your bodyweight" |
| Athlete with no training data at all | Full-page empty state: "Complete your first workout to start tracking progress" |
| Select "All time" date range | Charts show full training history |
| Unauthenticated user visits `/athlete/progress` | Redirect to `/athlete/login` |

## Technical Notes

### Data Fetching
- API endpoint: `GET /api/athlete/progress?range=8w` (server-side, session-authenticated)
- Returns pre-aggregated data for all chart sections in a single request
- Server component fetches data, passes to client chart components
- Response shape:
```typescript
interface AthleteProgressData {
  e1rmTrends: Record<string, { date: string; value: number }[]> // keyed by exerciseId
  weeklyVolume: { weekStart: string; tonnage: number }[]
  compliance: { assigned: number; completed: number; streak: number }
  personalRecords: {
    exerciseId: string
    exerciseName: string
    weight: number
    reps: number
    date: string
    isRecent: boolean // set within last 7 days
  }[]
  bodyweight: { date: string; weight: number }[] | null
  availableExercises: { id: string; name: string }[]
}
```

### Component Reuse
- Reuse `LineChart` and `BarChart` wrappers from Spec 07 analytics components
- Create `AthleteProgressPage` as a server component that fetches data
- Create `ProgressCharts` as a client component wrapping the interactive charts
- `PRList` component: simple list with badges, no chart library needed
- `ComplianceRing` component: SVG donut or recharts `PieChart` with single value

### Navigation Update
- Update `/athlete/layout.tsx` bottom nav from 4 tabs to 5:
  - Dashboard (Home icon)
  - Train (Dumbbell icon)
  - Calendar (Calendar icon)
  - History (Clock icon)
  - **Progress** (TrendingUp icon) — NEW

### Security
- All queries filter by `athleteId` from the authenticated session
- No athlete can see another athlete's progress data
- API route validates session before returning data

## Revision History
| Date | Change |
|------|--------|
| 2026-02-18 | Initial spec created from athlete features audit recommendation |
