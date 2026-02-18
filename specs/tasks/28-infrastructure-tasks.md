# Task Group 28: Infrastructure & Data Integrity

Source: specs/tasks/00-implied-features-audit.md (gaps #1, #6, #11, #12, #27)

### Priority 28: Infrastructure & Data Integrity

- [ ] **Task 28.1**: Create Notification model and database migration
  - Spec: specs/14-notifications.md
  - Acceptance: Prisma schema includes a `Notification` model with fields: `id`, `recipientId`, `recipientType` (enum: COACH, ATHLETE), `type` (enum: PROGRAM_ASSIGNED, WORKOUT_COMPLETED, CHECK_IN_REMINDER), `title`, `body`, `isRead` (default false), `createdAt`. Migration runs successfully. Indexes on `recipientId` and `recipientType`. `recipientId` is a String (not a relation FK) since it can reference either Coach or Athlete.

- [ ] **Task 28.2**: Integrate email service (Resend) for transactional notifications
  - Spec: specs/14-notifications.md
  - Acceptance: `src/lib/email.ts` exports a `sendEmail({ to, subject, html })` function wrapping the Resend SDK. Environment variable `RESEND_API_KEY` is documented in `.env.example`. Email sending is wrapped in try/catch — failures are logged but never block the calling operation. A `sendNotificationEmail(notification: Notification)` helper maps notification types to email templates with Cannoli Gang branding.

- [ ] **Task 28.3**: Add notification triggers to existing flows
  - Spec: specs/14-notifications.md
  - Acceptance: Creating a `ProgramAssignment` triggers a PROGRAM_ASSIGNED notification (creates DB record + sends email to athlete if athlete has email). Updating a `WorkoutSession` to FULLY_COMPLETED triggers a WORKOUT_COMPLETED notification (creates DB record + sends email to coach). Triggers are implemented as post-action calls in the relevant API routes or server actions, not as database triggers. Each trigger creates a Notification record AND calls `sendNotificationEmail`.

- [ ] **Task 28.4**: Add notification preferences to Coach and Athlete models
  - Spec: specs/14-notifications.md
  - Acceptance: Coach model gets a `notificationPreferences` Json field (default: `{ "emailOnWorkoutComplete": true, "emailOnCheckIn": true }`). Athlete model gets a `notificationPreferences` Json field (default: `{ "emailOnProgramAssigned": true }`). Notification triggers check preferences before sending email. DB record is always created regardless of email preference.

- [ ] **Task 28.5**: Create `getCurrentCoachId()` utility and audit all queries
  - Spec: specs/tasks/00-implied-features-audit.md (gap #6)
  - Acceptance: `src/lib/coach.ts` exports `getCurrentCoachId()` which returns the seeded coach's ID (hardcoded for now, swapped to session-derived when auth is added). Every Prisma query that returns coach-scoped data (athletes, programs, exercises, meets, dashboard stats) uses `where: { coachId: getCurrentCoachId() }`. Audit covers all API routes and server component queries. No query returns data without a coachId filter except global lookups (e.g., exercise by ID for training log).

- [ ] **Task 28.6**: Add `isArchived` field to Program model for soft-delete
  - Spec: specs/01-data-models-and-schema.md
  - Acceptance: Program model gets `isArchived Boolean @default(false)`. Migration runs. All program list queries add `where: { isArchived: false }` by default. `/programs` page does not show archived programs. A new "Archived Programs" filter/tab on `/programs` shows archived programs. The "Delete" button on a program is replaced with "Archive" which sets `isArchived: true`. A hard delete option exists only for programs with zero ProgramAssignments and zero WorkoutSessions. Archive action shows a warning: "This program will be hidden from listings. All training data will be preserved."

- [ ] **Task 28.7**: Add `isActive` field to Athlete model for archive vs hard delete
  - Spec: specs/03-athlete-management.md
  - Acceptance: Athlete model gets `isActive Boolean @default(true)`. Migration runs. `/athletes` page defaults to showing only active athletes (`where: { isActive: true }`). An "Archived" filter/tab shows inactive athletes. "Remove Athlete" sets `isActive: false` with a confirmation dialog. Hard delete is only available for athletes with zero SetLogs, zero WorkoutSessions, and zero MeetEntries. Archived athletes are excluded from dashboard counts, program assignment dropdowns, and analytics aggregations. Coach can reactivate an archived athlete.

- [ ] **Task 28.8**: Add make/miss fields to MeetEntry model
  - Spec: specs/09-competition-prep.md
  - Acceptance: MeetEntry model gets 9 new Boolean fields: `squat1Made`, `squat2Made`, `squat3Made`, `bench1Made`, `bench2Made`, `bench3Made`, `deadlift1Made`, `deadlift2Made`, `deadlift3Made` (all nullable, null = not attempted). Migration runs. Meet detail UI shows make/miss indicators next to each attempt weight (green check for made, red X for missed, grey dash for not attempted). Meet entry form includes a toggle for each attempt (made/missed/not taken). Total is calculated from best made attempt per lift.
