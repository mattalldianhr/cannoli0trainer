# Spec: Athlete Management (Client Profiles)

## Job to Be Done
Give the coach a centralized place to manage all 31-50 athletes with their profiles, training history, and notes — eliminating the need to track athlete info across WhatsApp, spreadsheets, and TeamBuildr.

## Requirements
- Athlete listing page at `/athletes`
- Individual athlete profile page at `/athletes/[id]`
- Create/edit athlete form with all profile fields
- Athlete list with search, filter by status (active/inactive), filter by type (competitor/recreational/remote)
- Athlete profile shows: basic info, current program, training history summary, bodyweight trend, competition history, injury notes
- Bulk actions: assign program to multiple athletes
- Quick stats per athlete: compliance rate, last logged workout, current estimated maxes

## Acceptance Criteria
- [ ] `/athletes` page lists all athletes for the coach
- [ ] Search filters athletes by name in real-time
- [ ] Filter chips for: all, competitors, remote, needs attention
- [ ] "Add Athlete" button opens creation form
- [ ] Create form validates required fields (name)
- [ ] `/athletes/[id]` shows full athlete profile
- [ ] Profile displays current program assignment
- [ ] Profile shows training log history (most recent first)
- [ ] Profile shows bodyweight chart if data exists
- [ ] Edit athlete saves changes to database
- [ ] Delete athlete with confirmation dialog

## Test Cases
| Input | Expected Output |
|-------|-----------------|
| Search "John" with 3 Johns in roster | Shows 3 matching athletes |
| Filter "competitors" | Only athletes with isCompetitor=true shown |
| Create athlete with name only | Athlete created with defaults |
| View athlete with 50 logged workouts | Training history paginated, most recent first |
| View athlete with 10 bodyweight entries | Line chart showing bodyweight trend |
| Delete athlete | Confirmation dialog, then removal from list |

## Technical Notes
- Use existing UI components: Card, Input, Button, Badge
- Athlete list as server component, search/filter as client component
- Dynamic route `/athletes/[id]` following existing `[slug]` and `[id]` patterns
- Prisma queries with pagination for training history
- Use `cn()` utility for conditional styling
- lucide-react icons for action buttons
- Consider `useSearchParams` for filter state in URL
