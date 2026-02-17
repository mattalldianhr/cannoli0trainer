# Spec: Coach Dashboard

## Job to Be Done
Give the coach a single landing page that replaces the need to switch between multiple apps. Show a real-time overview of athlete activity, program status, and key metrics — reducing the 10-15 hours/week spent on admin by surfacing what needs attention immediately.

## Requirements
- Dashboard page at `/dashboard`
- Overview cards: total athletes, active programs, workouts completed this week, athletes needing check-in
- Recent activity feed (last 7 days of athlete training logs)
- Quick action buttons: create program, add athlete, view analytics
- Athletes needing attention section (missed workouts, no logs in X days)
- Upcoming meets/competitions section
- Mobile-responsive (10/10 mobile importance rating)
- Navigation update: add Dashboard to header nav

## Acceptance Criteria
- [ ] `/dashboard` page renders with overview cards
- [ ] Cards show accurate counts from database (athletes, programs, recent completions)
- [ ] Activity feed shows recent SetLog entries grouped by athlete and date
- [ ] "Needs Attention" section flags athletes with no logs in 3+ days
- [ ] Upcoming meets section shows meets in next 30 days
- [ ] Quick action buttons navigate to correct pages
- [ ] Responsive layout works on mobile viewport (375px)
- [ ] Page uses server components where possible for performance
- [ ] Loading states shown while data fetches

## Test Cases
| Input | Expected Output |
|-------|-----------------|
| Coach with 0 athletes | Empty state with "Add your first athlete" CTA |
| Coach with 40 athletes, 5 logged today | Cards show 40 athletes, 5 recent logs |
| Athlete hasn't logged in 5 days | Appears in "Needs Attention" section |
| Meet in 14 days | Appears in upcoming meets section |
| Mobile viewport (375px width) | Cards stack vertically, all content accessible |

## Technical Notes
- Use existing layout components (Header, Container, Footer)
- Follow existing card patterns from `components/ui/card.tsx`
- Server component for data fetching, client components only for interactive elements
- Prisma queries with proper `include` for related data
- Use `@/lib/prisma` singleton for database access
- Path alias `@/*` maps to `./src/*`
- Group related stats queries to minimize database round-trips
