# Implied Features Audit

A holistic gap analysis of all specs, the PRD, implementation plan, and Prisma schema. This identifies features and behaviors that are assumed to work but were never explicitly specified or tasked.

---

## Critical (Blocks Core Workflow)

### 1. Notification System
- **Gap**: Specs 02 (dashboard), 06 (training log), and 10 (remote delivery) all reference notifications but there is no notification spec, no notification model, no notification API, and no notification tasks. Spec 10 says "Push/email notification when new program is assigned" and "Coach receives notification when workout is completed." Spec 02 says the dashboard shows recent activity. None of this has a backing system.
- **Related specs**: 02-coach-dashboard, 06-athlete-training-log, 10-remote-program-delivery
- **Recommendation**: Create a `Notification` model (id, recipientId, recipientType [coach/athlete], type [program_assigned, workout_completed, check_in_reminder], title, body, isRead, createdAt). Start with email via Resend/SendGrid for athlete-facing notifications. In-app notifications can be Phase 2. Need notification preferences (email on/off per type).
- **Estimated tasks**: 4 (model + migration, email service integration, notification triggers in existing flows, notification preferences UI)

### 2. Workout Scheduling / Calendar (Connecting Programs to Dates)
- **Gap**: Programs define weeks and days (Week 1 Day 1, etc.) but there is no mechanism to map "Week 1 Day 1" to an actual calendar date. When an athlete opens `/train`, the spec says "shows today's assigned workout" but there is no scheduling system that knows which workout is "today." The WorkoutSession model tracks completed sessions by date, but there is no `ScheduledWorkout` or date-mapping concept. The compliance rate metric (spec 07) requires knowing which workouts were *assigned* on which dates vs. completed, but without scheduling, "assigned" is undefined.
- **Related specs**: 04-program-builder, 06-athlete-training-log, 07-progress-analytics, 10-remote-program-delivery
- **Recommendation**: Note: Another agent (Task #1) appears to be writing a scheduling spec. This gap is being addressed. The key requirement is: when a program is assigned to an athlete with a start date, the system should map weekNumber/dayNumber to calendar dates (skipping rest days per a configurable weekly pattern). The athlete portal queries today's date against this mapping.
- **Estimated tasks**: 5-7 (already being handled by Task #1)

### 3. Authentication and Authorization
- **Gap**: The PRD says "Magic link authentication (no passwords)" for athletes. Spec 10 says "Athlete login/authentication (simple — email link or code)." But there is no auth model, no session model, no middleware, no route protection, and no task for any of this. Currently all API routes are unprotected. Anyone who knows the URL can hit any endpoint. There is no concept of "current user" anywhere. The coach dashboard hardcodes a coach context.
- **Related specs**: 10-remote-program-delivery, all API routes (specs 02-09)
- **Recommendation**: Note: Another agent (Task #2) appears to be writing an auth spec. At minimum need: session/token model, magic link email flow for athletes, coach login (email/password or magic link), Next.js middleware to protect `/dashboard/*`, `/athletes/*`, `/programs/*` routes for coach and `/train/*`, `/athlete/*` routes for athletes. API routes need auth checks.
- **Estimated tasks**: 6-8 (already being handled by Task #2)

### 4. Compliance Rate Calculation Has No Foundation
- **Gap**: Spec 07 (analytics) says "Training compliance (assigned vs. completed workouts as %)" and spec 03 says athlete profiles show "compliance rate." But compliance requires knowing: (a) how many workouts were *assigned* in a given period, and (b) how many the athlete *completed*. Without workout scheduling (gap #2), there is no way to know how many workouts were assigned. You can count completed WorkoutSessions, but you cannot calculate a percentage without a denominator.
- **Related specs**: 07-progress-analytics, 03-athlete-management, 02-coach-dashboard
- **Recommendation**: Once scheduling exists, compliance = (WorkoutSessions with status FULLY_COMPLETED or PARTIALLY_COMPLETED) / (ScheduledWorkouts in date range). Until then, the compliance chart should show absolute workout counts (sessions per week) rather than a misleading percentage.
- **Estimated tasks**: 1 (update analytics query once scheduling exists, already partially addressed by scheduling spec)

### 5. "Today's Workout" Resolution Logic
- **Gap**: Spec 06 says the athlete opens `/train` and sees today's workout. But the actual lookup logic is never specified. What query determines "today's workout"? Is it: find the ProgramAssignment for this athlete, find the Program, calculate which weekNumber/dayNumber maps to today, find the Workout matching that week/day, and load its WorkoutExercises? What if the athlete has multiple active programs? What if they missed yesterday and want to do it today instead? What if there is no workout today (rest day)?
- **Related specs**: 06-athlete-training-log, 10-remote-program-delivery
- **Recommendation**: Define a `resolveCurrentWorkout(athleteId, date)` function. Logic: (1) find active ProgramAssignment where startDate <= today <= endDate, (2) calculate weeks elapsed since startDate, derive weekNumber and dayNumber, (3) find matching Workout, (4) if no workout for today, show next upcoming. Handle multiple programs by showing a program selector. Handle missed days with a "catch up" or "skip" option.
- **Estimated tasks**: 2 (resolver function, UI for edge cases like rest day / multiple programs / catch-up)

### 6. Coach Context / Multi-Coach Isolation
- **Gap**: The PRD says "Single coach, single brand. No need for org-level abstractions." But the schema has `coachId` on every model (Athlete, Program, Exercise, CompetitionMeet). No spec or task defines how the "current coach" is determined. The dashboard, athlete list, program list, and exercise library all need to filter by coachId, but none of the specs mention this filter. If a second coach were ever added, there would be no data isolation.
- **Related specs**: All specs (02-12)
- **Recommendation**: For initial build: seed a single coach and hardcode the coachId in a server-side utility (`getCurrentCoachId()`). All Prisma queries must filter by coachId. When auth is added, derive coachId from the authenticated session. This is a cross-cutting concern that affects every API route and every page query.
- **Estimated tasks**: 1 (create utility function and audit all existing queries to use it)

---

## Important (Significant UX Impact)

### 7. Settings Page (Coach and Athlete Preferences)
- **Gap**: No spec mentions a settings page anywhere. But there are multiple implied settings with no home:
  - **Weight unit preference**: SetLog and BodyweightLog both have a `unit` field (kg/lbs). Who decides the default? The imported data is all in kg. The coach is in the US (likely prefers lbs). Is this per-coach, per-athlete, or per-set?
  - **Notification preferences**: If notifications exist, athletes need to opt in/out
  - **Coach profile editing**: brandName, email — nowhere to edit these after creation
  - **Rest timer defaults**: Spec 06 mentions a configurable rest timer — where is the default set?
  - **Timezone**: WorkoutSession uses a Date field. What timezone? The coach is in New York, athletes could be anywhere
- **Related specs**: 01-data-models, 06-athlete-training-log, 10-remote-program-delivery
- **Recommendation**: Create a minimal settings page at `/settings` with: coach profile (name, email, brandName), default weight unit (kg/lbs), default rest timer duration, timezone selection. Athlete preferences can be per-athlete fields on the Athlete model.
- **Estimated tasks**: 3 (settings page UI, settings API route, add unit/timezone preferences to Coach model)

### 8. Empty States Across All Pages
- **Gap**: Spec 02 (dashboard) has one test case for empty state ("Coach with 0 athletes"), but most specs have zero mention of empty states. A brand new coach will see empty pages everywhere: no athletes, no programs, no exercises (before seed), no analytics, no meets. Each of these needs a helpful empty state that guides the coach to the next action.
- **Related specs**: 02, 03, 04, 05, 06, 07, 08, 09
- **Recommendation**: Define empty states for each page:
  - `/dashboard`: "Welcome to Cannoli Trainer! Start by adding your first athlete." with CTA
  - `/athletes`: "No athletes yet. Add your first athlete to get started."
  - `/programs`: "No programs yet. Create your first program or start from a template."
  - `/exercises`: "Exercise library is empty. Seed the database or add exercises manually." (should not happen post-seed)
  - `/analytics`: "Not enough data yet. Athletes need to log workouts before analytics appear."
  - `/meets`: "No upcoming meets. Create a meet to start planning."
  - `/train` (athlete): "No workout assigned for today. Check back later or contact your coach."
- **Estimated tasks**: 2 (create shared EmptyState component, add to each page)

### 9. Error States and Validation Feedback
- **Gap**: No spec defines what happens when things go wrong. What does the athlete see if their set log fails to save (network error)? What does the coach see if program creation fails? What validation messages appear on forms? The program builder spec says "All changes auto-save or save on explicit action" but does not address save failures.
- **Related specs**: All specs with forms (03, 04, 05, 06, 09)
- **Recommendation**: Define a standard error handling pattern: (1) Toast notifications for transient errors ("Failed to save. Retrying..."), (2) Inline validation messages on forms (required fields, format validation), (3) Error boundaries for page-level crashes, (4) Retry logic for failed API calls in the training log (critical path). Use a toast library (sonner or react-hot-toast).
- **Estimated tasks**: 3 (toast/notification component, form validation patterns, error boundary wrapper)

### 10. Confirmation Dialogs for Destructive Actions
- **Gap**: Spec 03 mentions "Delete athlete with confirmation dialog" but no spec defines the confirmation dialog component or pattern. Other destructive actions with no confirmation specified: delete program, delete exercise (spec 05 mentions a "warning" for referenced exercises), delete meet, remove athlete from meet, unassign program. The program builder allows duplicating and reordering but does not mention undo.
- **Related specs**: 03, 04, 05, 09
- **Recommendation**: Create a shared `ConfirmDialog` component (Radix AlertDialog). Use it for: delete athlete, delete program, delete exercise, delete meet, unassign program, delete template. Each should explain consequences (e.g., "This will also delete 47 workout sessions and 1,234 set logs.").
- **Estimated tasks**: 1 (ConfirmDialog component — the individual pages already have delete actions that need to call it)

### 11. Data Lifecycle: Deleting Programs with Active Assignments
- **Gap**: The Prisma schema has `onDelete: Cascade` on ProgramAssignment -> Program. This means deleting a program silently deletes all assignments. But it does NOT cascade to WorkoutSessions (which have `onDelete: SetNull` for programId) or SetLogs (which link through WorkoutExercise -> Workout -> Program, all Cascade). So deleting a program would CASCADE-delete all its Workouts, which CASCADE-deletes all WorkoutExercises, which CASCADE-deletes all SetLogs. This means deleting a program destroys all historical training data for every athlete who used it. No spec addresses this.
- **Related specs**: 01-data-models, 04-program-builder
- **Recommendation**: Programs should support soft delete (archive) rather than hard delete. Add an `isArchived` boolean to Program. Archived programs are hidden from listings but their data is preserved. If hard delete is ever needed, warn the coach about the cascade impact with exact counts. Consider moving SetLogs to be linked to WorkoutSession (which survives program deletion via SetNull) instead of WorkoutExercise.
- **Estimated tasks**: 3 (add isArchived field, update program queries to filter archived, add archive UI with warning)

### 12. Athlete Archive vs. Delete
- **Gap**: Spec 03 says "Delete athlete with confirmation dialog." The Prisma schema cascades deletes: deleting an Athlete cascades to ProgramAssignments, SetLogs, BodyweightLogs, MeetEntries, WorkoutSessions, MaxSnapshots. All historical data is gone. The PRD mentions 31-50 athletes — coaches regularly drop and add clients. Losing all historical data when an athlete leaves is destructive.
- **Related specs**: 03-athlete-management, 01-data-models
- **Recommendation**: Add `isActive` boolean to Athlete (default true). "Removing" an athlete sets isActive=false. Inactive athletes are hidden from the main roster but their data is preserved. Coach can view archived athletes via a filter. Only allow hard delete for athletes with zero training data.
- **Estimated tasks**: 2 (add isActive field, update athlete list filtering and archive UI)

### 13. Pagination and Performance at Scale
- **Gap**: The PRD says 31-50 athletes. The imported data has 31,660 SetLogs and 2,033 WorkoutSessions. Several pages will have large datasets but no spec mentions pagination:
  - `/exercises` has 948 exercises — the library page loads them all?
  - Athlete training history could have hundreds of sessions
  - Analytics queries aggregate over thousands of SetLogs
  - The dashboard activity feed queries 7 days of logs across all athletes
  - Exercise picker in program builder searches 948 exercises
- **Related specs**: 03, 05, 06, 07, 02
- **Recommendation**: Implement pagination for: exercise library (30 per page with infinite scroll or load-more), athlete training history (20 per page), dashboard activity feed (limit to 20 items). Analytics queries should use database-level aggregation (GROUP BY, SUM) not client-side processing. Exercise picker should use server-side search with limit, not load all 948 into client memory.
- **Estimated tasks**: 2 (add pagination to API routes, update UI components to support pagination)

### 14. Workout History View for Coach
- **Gap**: The coach needs to see what an athlete did in past workouts. Spec 03 says the athlete profile shows "training history summary" and "training log history (most recent first)." But the format of this history view is never defined. Is it a list of dates with summaries? Can the coach click into a specific session and see every set? Can the coach see the workout as it was prescribed vs. what the athlete actually did? This is a primary use case — the coach reviews athlete logs daily.
- **Related specs**: 03-athlete-management, 06-athlete-training-log
- **Recommendation**: Define a workout history component: (1) list view of WorkoutSessions with date, title, completion %, total volume, (2) detail view showing each exercise with prescribed vs. actual sets side by side, (3) ability to add coach notes to completed sessions. The prescribed vs. actual comparison is key for coaching decisions.
- **Estimated tasks**: 3 (session list component, session detail with prescribed vs actual, coach notes on sessions)

### 15. Program Builder Edit Mode
- **Gap**: Spec 04 mentions `/programs/[id]/edit` as a route but all implementation tasks focus on `/programs/new`. There are no tasks for loading an existing program into the builder, editing it, and saving updates. The "Save" task (7.8) says "create/update" but the builder state management may not handle loading existing data. How does the coach modify Week 3 of an in-progress program? What happens to the athlete's already-logged data if the coach changes the prescribed sets?
- **Related specs**: 04-program-builder
- **Recommendation**: Ensure the program builder can hydrate from an existing program's database records. Editing a program that athletes are actively using should create a new version or only affect future workouts, not retroactively change completed sessions. At minimum, add a warning: "Athletes have already logged data for this program."
- **Estimated tasks**: 2 (load existing program into builder state, handle edit-in-progress warnings)

---

## Nice-to-Have (Polish)

### 16. Loading/Skeleton States
- **Gap**: Spec 02 mentions loading states in deferred features. No other spec mentions loading states. Every server-fetched page will have a loading period. Without skeletons, users see blank screens or layout shifts.
- **Related specs**: All page specs
- **Recommendation**: Create skeleton components for: stat cards, list items, chart placeholders, profile headers. Use React Suspense boundaries with `loading.tsx` files in Next.js App Router.
- **Estimated tasks**: 2 (skeleton component library, add loading.tsx files to each route)

### 17. Toast/Feedback After Actions
- **Gap**: No spec defines what happens after successful actions. When the coach saves a program, adds an athlete, assigns a program, or logs a set — what feedback do they get? Currently the only feedback mechanism would be URL navigation (redirect to list page). Missing: success toasts, optimistic UI updates, save indicators.
- **Related specs**: 03, 04, 05, 06, 09
- **Recommendation**: Install sonner or react-hot-toast. Add success toasts for: athlete created, program saved, program assigned, template created, exercise added, meet created, set logged. Add error toasts for all failed operations.
- **Estimated tasks**: 1 (install toast library, add to existing action handlers)

### 18. Undo Capability
- **Gap**: No spec mentions undo anywhere. The program builder is the most critical area — accidentally deleting a week of exercises with no undo would be frustrating. Set logging has no undo for accidentally logged sets.
- **Related specs**: 04-program-builder, 06-athlete-training-log
- **Recommendation**: For the program builder: maintain an undo stack in local state (last 10 actions). For set logging: allow editing/deleting a just-logged set within the current session. Full undo across the platform is overkill for V1.
- **Estimated tasks**: 2 (undo stack in program builder state, edit/delete set in training log)

### 19. Accessibility (WCAG Compliance)
- **Gap**: The PRD mentions "10/10 mobile importance" but says nothing about accessibility. No spec mentions keyboard navigation, screen reader support, ARIA labels, color contrast, or focus management. The platform uses Radix UI (which has good built-in accessibility), but custom components (RPE selector, program builder, training log grid) may not be accessible.
- **Related specs**: All UI specs
- **Recommendation**: For V1, rely on Radix UI's built-in accessibility. Audit custom components for: keyboard navigation (especially RPE selector and program builder), focus trapping in modals/dialogs, ARIA labels on icon-only buttons, color contrast (especially for superset colors and RPE indicators). Full WCAG 2.1 AA compliance is a Phase 2 goal.
- **Estimated tasks**: 2 (accessibility audit of custom components, fix critical issues)

### 20. SEO and Public/Private Page Separation
- **Gap**: The PRD says this is a custom build for Cannoli Gang. No spec distinguishes between public and private pages. Are athlete portals indexed by search engines? Is the dashboard public? Currently there is no robots.txt and no auth, so everything is public.
- **Related specs**: 10-remote-program-delivery
- **Recommendation**: All coaching pages should be `noindex`. Only the landing page (if one exists) should be indexable. Add a `robots.txt` that disallows `/dashboard`, `/athletes`, `/programs`, `/train`, `/analytics`, `/meets`. Once auth exists, unauthenticated users should see a login page, not data.
- **Estimated tasks**: 1 (add robots.txt and noindex meta tags)

### 21. Rate Limiting and CSRF Protection on API Routes
- **Gap**: All API routes are currently unprotected. No rate limiting, no CSRF tokens, no input sanitization beyond Prisma's parameterized queries. The PRD does not mention security requirements. Once the platform is deployed publicly, the API is vulnerable to abuse.
- **Related specs**: All API routes (Priority 4 tasks)
- **Recommendation**: Add rate limiting middleware (e.g., `next-rate-limit` or custom with Redis/in-memory store). CSRF is less critical for API routes using Bearer tokens (APIs are inherently CSRF-safe if auth uses headers not cookies). Input validation with zod on all POST/PUT routes. Sanitize string inputs to prevent XSS in rendered notes/descriptions.
- **Estimated tasks**: 2 (rate limiting middleware, zod input validation on API routes)

### 22. Real-Time Updates (Coach Desktop, Athlete Mobile)
- **Gap**: The PRD says "Most athletes are remote." Spec 10 says "Coach receives notification when workout is completed." But no spec defines whether updates are real-time or require manual refresh. When an athlete completes a set, does the coach's dashboard update immediately? The current architecture (server components with Prisma) requires a full page refresh to see new data.
- **Related specs**: 02-coach-dashboard, 06-athlete-training-log, 10-remote-program-delivery
- **Recommendation**: For V1, use polling (refetch every 60 seconds on the dashboard activity feed). Real-time via WebSockets or Server-Sent Events (SSE) is Phase 2. The coach does not need instant updates — a 1-minute delay is fine.
- **Estimated tasks**: 1 (add polling interval to dashboard activity feed)

### 23. PWA Manifest and Mobile Install
- **Gap**: The PRD says "PWA manifest for 'add to home screen' mobile experience." No spec or task creates the PWA manifest file, service worker registration, or mobile install prompt. Without this, athletes cannot "install" the app on their phones — they just have a browser bookmark.
- **Related specs**: 10-remote-program-delivery, PRD (Technical Architecture)
- **Recommendation**: Create a `manifest.json` with Cannoli Gang branding (name, icons, theme color, start URL `/train`). Add `<link rel="manifest">` to root layout. Create app icons at required sizes (192x192, 512x512). No service worker needed initially (offline support is out of scope).
- **Estimated tasks**: 1 (manifest.json + icons + meta tags)

### 24. CSV Import (Not Just Export)
- **Gap**: Spec 07 mentions CSV export but not import. The PRD says the coach wants "flexibility of Google Sheets." The TeamBuildr data was imported via a custom script. But if the coach has other athletes with data in spreadsheets, there is no way to import it. New athletes migrating from other platforms will need data import.
- **Recommendation**: Phase 2 feature. Document a CSV import format for: athletes (name, email, bodyweight), set logs (date, exercise, sets, reps, weight, RPE), bodyweight logs. Create an import page with file upload, preview, and confirmation.
- **Estimated tasks**: 3 (CSV parser, import preview UI, import execution with validation)

### 25. Superset Display in Training Log
- **Gap**: The schema supports supersets (supersetGroup, supersetColor on WorkoutExercise). The program builder presumably lets coaches create supersets. But the training log spec (06) does not mention how supersets are displayed to the athlete. Do superset exercises appear grouped? With matching colors? Does the athlete alternate between them, or log all sets of exercise A before exercise B?
- **Related specs**: 06-athlete-training-log, 04-program-builder
- **Recommendation**: In the training log, group exercises by supersetGroup. Display them with their supersetColor as a visual grouping indicator (left border or background tint). The athlete logs sets in alternating fashion (set 1 of A, set 1 of B, set 2 of A, set 2 of B) — this matches gym practice.
- **Estimated tasks**: 1 (update training log UI to handle superset grouping)

### 26. Bodyweight Logging Entry Point
- **Gap**: The BodyweightLog model exists and spec 07 shows bodyweight trend charts. But no spec defines where or how the athlete (or coach) logs bodyweight entries. There is no "Log Bodyweight" form anywhere. Spec 06 (training log) does not include a bodyweight field. The only API route is `/api/bodyweight` but there is no UI that calls it.
- **Related specs**: 07-progress-analytics, 03-athlete-management
- **Recommendation**: Add a bodyweight input to either: (a) the training log session summary (after workout completion), (b) the athlete profile page (coach enters it), or (c) both. For competitors tracking weight class, a quick daily bodyweight log is important.
- **Estimated tasks**: 1 (add bodyweight input to training log or athlete profile)

### 27. MeetEntry Make/Miss Tracking
- **Gap**: Spec 09 says "Post-meet: enter actual attempts and mark make/miss." The MeetEntry model has squat1, squat2, squat3, etc. (Floats) but no make/miss boolean fields. If the athlete misses bench2 at 100kg and retakes it for bench3, how is this recorded? A Float value of 100 does not indicate whether the lift was made or missed.
- **Related specs**: 09-competition-prep
- **Recommendation**: Add make/miss boolean fields to MeetEntry (squat1Made, squat2Made, squat3Made, etc.) or store attempt results as a JSON structure: `{ weight: 100, result: "good_lift" | "no_lift" | "not_taken" }`. The latter is more flexible for edge cases (scratched attempts, redlights).
- **Estimated tasks**: 1 (add result fields to MeetEntry model, update meet detail UI)

---

## Summary

- **Total implied features found**: 27
- **Critical**: 6 (notifications, scheduling, auth, compliance foundation, workout resolution, coach context)
- **Important**: 9 (settings page, empty states, error handling, confirmations, program deletion lifecycle, athlete archiving, pagination, workout history view, program edit mode)
- **Nice-to-have**: 12 (skeletons, toasts, undo, accessibility, SEO, rate limiting, real-time updates, PWA manifest, CSV import, superset display, bodyweight logging, meet make/miss tracking)

### Notes on In-Progress Work
- Scheduling (gap #2) is being addressed by Task #1
- Auth (gap #3) is being addressed by Task #2
- Several "Important" items (empty states, error handling, confirmations, toasts) could be grouped into a single "UX Polish" sprint
- The program deletion cascade (gap #11) is a data integrity risk that should be addressed before production launch
- The coach context utility (gap #6) is a 30-minute fix that should happen immediately — it affects every query in the app
