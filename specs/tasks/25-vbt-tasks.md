# Task Group 25: VBT Fatigue Tracking Enhancements

Spec: specs/08-vbt-integration.md

### Priority 25: Cross-Session Velocity Fatigue Tracking

- [ ] **Task 25.1**: Implement within-session velocity loss display per exercise
  - Spec: specs/08-vbt-integration.md
  - Acceptance: Session view shows velocity drop % from set 1 to final set for each exercise with velocity data. Flag displayed when loss exceeds 20% threshold. Calculated as `((set1 - setN) / set1) * 100`. Shows "N/A" when fewer than 2 sets have velocity data.

- [ ] **Task 25.2**: Build cross-session velocity trend chart (week-over-week fatigue)
  - Spec: specs/08-vbt-integration.md
  - Acceptance: VBT analytics section shows line chart of mean velocity at approximately 80% 1RM load bracket over time (weekly data points). Alert indicator when week-over-week velocity drops >5% at same load. Requires at least 3 weeks of velocity data to display trend. `lib/vbt/fatigue.ts` exports calculation functions with unit tests.
