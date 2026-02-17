# Spec: Competition Prep & Meet Day Tools

## Job to Be Done
Manage the hardest part of meet day — warm-up room management, timing across multiple athlete flights, and attempt planning — replacing the chaos of juggling spreadsheets and stopwatches. Warm-up timing is standalone with manual flight time entry (LiftingCast integration is out of scope).

## Requirements
- Meet management page at `/meets`
- Individual meet page at `/meets/[id]`
- Create meet with name, date, location, federation
- Add athletes to meet with weight class and entry details
- Attempt planning: set planned openers, 2nd/3rd attempts with notes
- Warm-up timing calculator (based on flight position and estimated start time)
- Warm-up timer display: countdown to each warm-up set, with set weights
- Multiple athlete flight tracking on single screen
- Meet day checklist per athlete
- Post-meet results entry (actual attempts, make/miss)
- Manual flight time entry (LiftingCast out of scope)

## Acceptance Criteria
- [ ] `/meets` lists all competitions
- [ ] Create meet form with name, date, location, federation
- [ ] Add athletes to meet with weight class assignment
- [ ] Attempt planning UI: 3 attempts per lift (squat, bench, deadlift)
- [ ] Opener selection with estimated 1RM reference
- [ ] Warm-up timing calculator takes flight start time and generates warm-up schedule
- [ ] Warm-up timer shows countdown per warm-up set with target weights
- [ ] Multi-athlete view shows all athletes' warm-up status on one screen
- [ ] Post-meet: enter actual attempts and mark make/miss
- [ ] Meet results summary with totals and placement

## Test Cases
| Input | Expected Output |
|-------|-----------------|
| Create "2025 North Brooklyn Classic" | Meet appears in list |
| Add 5 athletes to meet | All 5 shown on meet page with weight classes |
| Set squat opener at 200 kg | Warm-up calculator generates sets: 60, 100, 140, 160, 180 kg |
| Flight starts at 10:30 AM, 8 min between attempts | Warm-up schedule: first warm-up at 10:06 AM |
| 3 athletes in same flight | Multi-athlete view shows parallel warm-up timelines |
| Enter actual attempts: 200/210/217.5 | Results show 217.5 best squat |
| All lifts entered | Total calculated, DOTS/Wilks estimated |

## Technical Notes
- Warm-up timing: work backward from flight start time
  - Typical warm-up: 5-6 sets over ~15-20 min before first attempt
  - Account for time between attempts (configurable, default 1.5 min)
- Warm-up weight calculation: standard percentages of opener (e.g., 50%, 60%, 70%, 80%, 90%, opener)
- CompetitionMeet and MeetEntry models from schema spec
- LiftingCast integration: out of scope — all flight/timing data is manual entry
- Consider a dedicated `components/meets/` directory
- Warm-up timer needs client-side interval/countdown logic
- Multi-athlete view: grid layout showing each athlete's current warm-up status
