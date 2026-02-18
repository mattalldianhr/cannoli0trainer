# Spec: Notification System

## Job to Be Done
Keep coaches and athletes informed about important events (program assignments, workout completions, check-in reminders) without requiring manual communication via WhatsApp or text. Reduce the coach's admin overhead by automating routine status updates.

## Requirements
- Notification model tracking all system-generated notifications
- Email delivery via Resend for athlete-facing and coach-facing notifications
- Notification triggers embedded in existing workflows (not separate cron jobs)
- Per-user notification preferences (email on/off per notification type)
- In-app notification list (Phase 2 — deferred)

## Notification Types

### PROGRAM_ASSIGNED (coach -> athlete)
- **Trigger**: Coach creates a ProgramAssignment record
- **Recipient**: The assigned athlete
- **Email content**: Program name, start date, link to `/athlete/train`
- **Condition**: Only send if athlete has a verified email and `emailOnProgramAssigned` preference is true

### WORKOUT_COMPLETED (athlete -> coach)
- **Trigger**: WorkoutSession status changes to FULLY_COMPLETED
- **Recipient**: The athlete's coach
- **Email content**: Athlete name, workout name, completion percentage, date, link to `/athletes/[id]`
- **Condition**: Only send if coach's `emailOnWorkoutComplete` preference is true

### CHECK_IN_REMINDER (system -> coach)
- **Trigger**: Phase 2 (requires cron job or scheduled function)
- **Recipient**: Coach
- **Email content**: List of athletes with no activity in 3+ days
- **Condition**: Deferred — requires background job infrastructure

## Data Model

```prisma
enum NotificationRecipientType {
  COACH
  ATHLETE
}

enum NotificationType {
  PROGRAM_ASSIGNED
  WORKOUT_COMPLETED
  CHECK_IN_REMINDER
}

model Notification {
  id            String                    @id @default(uuid())
  recipientId   String
  recipientType NotificationRecipientType
  type          NotificationType
  title         String
  body          String                    @db.Text
  isRead        Boolean                   @default(false)
  createdAt     DateTime                  @default(now())

  @@index([recipientId, recipientType])
  @@index([recipientId, isRead])
}
```

Note: `recipientId` is a plain String (not a Prisma relation) because it references either a Coach ID or an Athlete ID depending on `recipientType`. This avoids needing two nullable FK columns.

## Notification Preferences

Stored as a Json field on Coach and Athlete models:

**Coach preferences** (default):
```json
{
  "emailOnWorkoutComplete": true,
  "emailOnCheckIn": true
}
```

**Athlete preferences** (default):
```json
{
  "emailOnProgramAssigned": true
}
```

Preferences are checked before sending email. The Notification DB record is always created regardless of email preference (for future in-app notification support).

## Email Service

**Provider**: Resend (via `resend` npm package)

**Low-level email**: `src/lib/email.ts`
- `sendEmail({ to, subject, html })` — Resend wrapper
- `brandedEmailHtml({ title, body, ctaLabel?, ctaUrl? })` — branded HTML template
- `emailCtaButton(label, url)` — reusable CTA button HTML

**Notification logic**: `src/lib/notifications.ts`
- `notifyProgramAssignment({ athleteId, athleteName, athleteEmail, programName, startDate, notificationPreferences? })` — creates DB record + sends email to athlete
- `notifyWorkoutCompletion({ athleteId, athleteName, coachId, coachEmail, sessionName, completionPct, date, notificationPreferences? })` — creates DB record + sends email to coach
- `parseCoachPreferences(raw)` / `parseAthletePreferences(raw)` — safe JSON preference parsers with defaults
- All email sends are wrapped in try/catch — failures are logged but never block the calling operation

**Email templates**: Simple branded HTML with Cannoli Gang colors (orange accent, dark background). No complex templating engine — template strings are sufficient for V1.

## Integration Points

1. **Program assignment** (`/api/programs/[id]/assign`): After creating ProgramAssignment, calls `notifyProgramAssignment(...)` with athlete details and preferences
2. **Workout completion** (`src/lib/training/update-session-status.ts`): When status changes to FULLY_COMPLETED, calls `notifyWorkoutCompletion(...)` with coach details and preferences

## Acceptance Criteria
- [ ] Notification model exists in Prisma schema with proper indexes
- [ ] Email service sends branded emails via Resend
- [ ] Program assignment triggers athlete email notification
- [ ] Workout completion triggers coach email notification
- [ ] Notification preferences are respected (no email if opted out)
- [ ] Email failures are logged but do not block the user action
- [ ] All notification records are persisted in the database

## Deferred Features (Phase 2)
- In-app notification bell with unread count in header
- Mark-as-read UI for in-app notifications
- CHECK_IN_REMINDER via cron/scheduled function
- Push notifications via service worker
- Notification digest (daily summary email instead of per-event)

## Technical Notes
- Resend free tier: 100 emails/day, 3,000/month — sufficient for V1 with 31-50 athletes
- Email service config shares env vars with NextAuth Email provider (see specs/10-remote-program-delivery.md)
- No separate notification microservice — notifications are inline function calls in existing API routes
- Future migration to in-app: query Notification table by recipientId + isRead, render in a dropdown

## Revision History
| Date | Change |
|------|--------|
| 2026-02-18 | Initial spec created from implied features audit gap #1 |
| 2026-02-18 | Updated function names and file layout to match implementation (Tasks 28.1-28.4) |
