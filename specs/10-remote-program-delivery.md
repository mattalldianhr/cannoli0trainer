# Spec: Remote Program Delivery & Athlete Experience

## Job to Be Done
Deliver programs to 31-50 mostly-remote athletes through a mobile-first experience that's better than TeamBuildr's clunky UX — so athletes can view their workouts, log training, and stay connected without the coach chasing them via WhatsApp.

## Requirements
- Athlete portal/view (separate from coach view)
- Athlete login/authentication (simple — email link or code)
- Athlete sees their current program and today's workout
- Athlete calendar showing upcoming workouts
- Workout history (past completed workouts)
- Push/email notification when new program is assigned
- Athlete can leave notes/comments on workouts
- Coach receives notification when workout is completed
- Mobile-optimized for gym use (large tap targets, clear layout)

## Acceptance Criteria
- [ ] Athlete can access their portal via unique link or login
- [ ] Portal shows current program name and today's workout
- [ ] Calendar view shows workout schedule for current week
- [ ] Past workouts accessible with completion status
- [ ] Athlete can add notes to individual workouts
- [ ] New program assignment triggers notification (email or in-app)
- [ ] Workout completion triggers coach notification
- [ ] All views work on 375px mobile viewport
- [ ] Large, thumb-friendly tap targets (min 44px)

## Test Cases
| Input | Expected Output |
|-------|-----------------|
| Athlete opens portal | Sees today's workout prominently |
| No workout today | "Rest day" or next scheduled workout shown |
| Athlete views calendar | Current week with workout days highlighted |
| Athlete taps past workout | Shows logged sets, reps, weights |
| Coach assigns new program | Athlete gets email notification |
| Athlete completes workout | Coach dashboard shows activity |

## Technical Notes
- Auth: magic link (email-based, no password) for initial build. OAuth added later.
- Could use Next.js middleware for athlete vs. coach routing
- Athlete routes: `/athlete/*` or similar namespace
- Notification: start with email via API (SendGrid, Resend, etc.) — in-app notifications as follow-up
- This spec depends on: athlete management, program builder, training log
- Reuse training log component for athlete's workout view
- PWA manifest for "add to home screen" mobile experience (no offline support initially)
- Deployed on Railway with PostgreSQL
- This is a custom build for Cannoli Gang — branding is baked in, not configurable
