# Task Group 29: Settings & Preferences

Source: specs/tasks/00-implied-features-audit.md (gap #7)

### Priority 29: Settings & Preferences

- [ ] **Task 29.1**: Add settings fields to Coach model
  - Spec: specs/01-data-models-and-schema.md
  - Acceptance: Coach model gets new fields: `defaultWeightUnit WeightUnit @default(lbs)`, `timezone String @default("America/New_York")`, `defaultRestTimerSeconds Int @default(120)`. Migration runs. Seed script sets reasonable defaults for the existing coach record.

- [ ] **Task 29.2**: Create Settings page at `/settings`
  - Spec: specs/tasks/00-implied-features-audit.md (gap #7)
  - Acceptance: `/settings` page renders with sections: Profile (name, email, brandName), Preferences (default weight unit toggle kg/lbs, default rest timer in seconds, timezone dropdown). Form uses server actions to update Coach record. Success toast on save. Navigation includes a "Settings" link (gear icon in header or sidebar). Page is server-rendered with client-side form interactivity only.

- [ ] **Task 29.3**: Create Settings API route for coach preferences
  - Spec: specs/tasks/00-implied-features-audit.md (gap #7)
  - Acceptance: `GET /api/settings` returns current coach settings (profile + preferences). `PUT /api/settings` accepts partial updates to coach profile and preference fields. Validates input with zod: `timezone` must be a valid IANA timezone string, `defaultRestTimerSeconds` must be 0-600, `defaultWeightUnit` must be `kg` or `lbs`. Returns updated coach record.

- [ ] **Task 29.4**: Wire default weight unit preference into set logging
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: When creating a new SetLog, the `unit` field defaults to the coach's `defaultWeightUnit` setting instead of hardcoded `lbs`. The training log UI pre-selects the coach's preferred unit when logging a new set. Athletes can still override per-set. The coach preference is fetched once on page load, not per-set.

- [ ] **Task 29.5**: Wire default rest timer into training log
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: The rest timer in the training log defaults to the coach's `defaultRestTimerSeconds` from settings instead of a hardcoded value. Timer duration can still be adjusted per-session by the athlete. The default is read from the coach record associated with the athlete's program assignment.
