# Task Group 27: RPE/RIR Enhancements

Spec: specs/12-rpe-rir-support.md

### Priority 27: RPE History, Accuracy, Autoregulation Display, RIR Co-Display

- [ ] **Task 27.1**: Build RPE history chart on athlete analytics (RPE over time per exercise)
  - Spec: specs/12-rpe-rir-support.md
  - Acceptance: Scatter + trend line chart showing reported RPE values over time for a selected exercise. Filterable by exercise via dropdown. Individual sets as scatter points, moving average as trend line. Visible on athlete analytics tab. Empty state when no RPE data exists.

- [ ] **Task 27.2**: Implement RPE accuracy metric (reported vs estimated effort)
  - Spec: specs/12-rpe-rir-support.md
  - Acceptance: `lib/analytics/rpe-accuracy.ts` exports `calculateRpeAccuracy()` that compares reported RPE to estimated RPE using rpe-table reverse lookup + MaxSnapshot e1RM. Displays per-exercise and aggregate "avg +/- X RPE" metric. Trend chart shows accuracy improving/degrading over time. Unit tested against known inputs.

- [ ] **Task 27.3**: Build autoregulated prescription display and RIR co-display
  - Spec: specs/12-rpe-rir-support.md
  - Acceptance: Program builder renders "Work up to RPE X, then -Y%" when `prescriptionType = autoregulated`. Training log shows same formatted text. Everywhere RPE is displayed, RIR shown alongside (e.g., "RPE 8 / 2 RIR"). `RPEWithRIR` shared component handles formatting. Half-increments supported (RPE 8.5 = 1.5 RIR).
