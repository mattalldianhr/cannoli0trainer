# Task Group 26: Competition Results Enhancements

Spec: specs/09-competition-prep.md

### Priority 26: Post-Meet Results Entry & Scoring

- [ ] **Task 26.1**: Build post-meet results entry UI with make/miss per attempt
  - Spec: specs/09-competition-prep.md
  - Acceptance: Meet page has "Enter Results" mode showing 3 attempts per lift (squat, bench, deadlift) for each athlete. Each attempt has weight input + good/miss toggle. Pre-fills from planned attempts if available. Best successful attempt auto-calculated per lift. Total auto-calculated. Results stored in MeetEntry `attemptResults` JSON field. Add Prisma migration for `attemptResults` field if needed.

- [ ] **Task 26.2**: Build meet results summary with DOTS and Wilks scores
  - Spec: specs/09-competition-prep.md
  - Acceptance: After results entry, meet page shows results card per athlete: best attempt per lift, total, DOTS score, Wilks score. Scores calculated using `powerlifting-formulas` package (already installed). Requires athlete bodyweight and gender. `lib/meets/results.ts` exports scoring functions. Handles edge cases: all attempts missed on a lift = 0 for that lift, incomplete results show partial summary.
