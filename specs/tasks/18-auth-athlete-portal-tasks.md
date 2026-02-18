# Tasks: Authentication & Athlete Portal

> Spec: [specs/10-remote-program-delivery.md](../10-remote-program-delivery.md)

### Priority 18: Authentication & Athlete Portal

- [ ] **Task 18.1**: Install NextAuth v5, Prisma adapter, and Resend; configure auth
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: `next-auth@5`, `@auth/prisma-adapter`, and `resend` installed. `src/lib/auth.ts` exports `{ handlers, auth, signIn, signOut }` with Email provider and PrismaAdapter. API route handler at `src/app/api/auth/[...nextauth]/route.ts` exports GET and POST. `.env.example` documents `AUTH_SECRET`, `AUTH_URL`, `RESEND_API_KEY`, `EMAIL_SERVER`, `EMAIL_FROM`. `npm run build` passes.

- [ ] **Task 18.2**: Add NextAuth models to Prisma schema and link Athlete to User
  - Spec: specs/10-remote-program-delivery.md, specs/01-data-models-and-schema.md
  - Acceptance: Prisma schema includes `User`, `Account`, `Session`, `VerificationToken` models matching NextAuth v5 Prisma adapter requirements. `Athlete` model has optional `userId String? @unique` field with relation to `User`. `npx prisma validate` passes. Migration runs successfully (`npx prisma migrate dev --name add-auth-models`).

- [ ] **Task 18.3**: Build athlete login page at `/athlete/login` with magic link form
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: Page at `/athlete/login` renders email input and "Send Login Link" button. Submitting calls NextAuth `signIn("email", { email })`. Success redirects to `/athlete/check-email`. Error shows inline message ("No account found for this email"). Mobile-optimized with Cannoli branding. Works on 375px viewport.

- [ ] **Task 18.4**: Build "Check your email" confirmation page at `/athlete/check-email`
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: Page at `/athlete/check-email` shows confirmation message ("We sent a login link to your email"), email provider hints (check spam), and a "Try again" link back to `/athlete/login`. No auth required to view this page. Cannoli branding consistent with login page.

- [ ] **Task 18.5**: Add Next.js middleware to protect `/athlete/*` routes
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: `src/middleware.ts` uses NextAuth middleware to protect all `/athlete/*` routes except `/athlete/login` and `/athlete/check-email`. Unauthenticated requests to `/athlete`, `/athlete/train`, `/athlete/calendar`, `/athlete/history` redirect to `/athlete/login`. Authenticated requests pass through. Coach routes (`/dashboard`, `/athletes`, `/programs`, etc.) are unaffected.

- [ ] **Task 18.6**: Create athlete layout with mobile bottom navigation
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: `src/app/athlete/layout.tsx` wraps all athlete pages with: SessionProvider for auth state, bottom navigation bar with 4 tabs (Dashboard, Train, Calendar, History) using icons from lucide-react, active tab highlighting, Cannoli Gang branding in header. Bottom nav has min 44px tap targets. Layout hides coach navigation entirely. Works on 375px viewport with no horizontal scroll.

- [ ] **Task 18.7**: Build athlete dashboard page at `/athlete`
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: Page shows: hero card with today's workout name and program name (or "Rest Day" with next scheduled workout), quick stats (training streak, workouts this week, weekly completion rate), last 3 completed sessions as cards. Data fetched server-side using `athleteId` from session. Loading skeleton while data fetches. Empty state for new athletes with no history.

- [ ] **Task 18.8**: Build athlete training view at `/athlete/train` reusing TrainingLog
  - Spec: specs/10-remote-program-delivery.md, specs/06-athlete-training-log.md
  - Acceptance: Page renders `TrainingLog` component with `athleteId` from session (no athlete selector dropdown). Add `mode` prop to `TrainingLog`: `'coach'` shows athlete picker (existing behavior), `'athlete'` hides it and uses provided `athleteId`. All existing TrainingLog functionality works: exercise display, set logging, RPE input, previous performance reference, completion summary. API routes for set logging accept requests from authenticated athlete sessions.

- [ ] **Task 18.9**: Build athlete calendar view at `/athlete/calendar`
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: Weekly calendar view showing 7 days with workout indicators. Days with scheduled workouts show workout name; completed days show checkmark + completion %. Tapping a day shows workout preview (exercise list). Month view toggle button. Past data from `WorkoutSession`, future data from `Workout` records via `ProgramAssignment`. Current day highlighted. Works on 375px viewport.

- [ ] **Task 18.10**: Build athlete history view at `/athlete/history`
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: Reverse-chronological list of `WorkoutSession` records for the authenticated athlete. Each entry shows: date, workout name, completion %, total volume (formatted). Tap to expand shows full exercise list with logged sets (weight x reps). Pagination: load 20 sessions at a time with "Load more" button. Empty state for athletes with no history.

- [ ] **Task 18.11**: Send email notification on program assignment
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: When a `ProgramAssignment` is created via the existing `/api/programs/[id]/assign` route, send an email to the athlete using Resend. Email contains: program name, start date, direct link to `/athlete/train`. Only sends if athlete has a non-null email. Email uses branded HTML template with Cannoli styling. Notification function in `src/lib/notifications.ts`. Failure to send email does not block the assignment (fire-and-forget with error logging).

- [ ] **Task 18.12**: Send email notification on workout completion
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: When `WorkoutSession.status` is updated to `FULLY_COMPLETED` via training log API, send an email to the coach. Email contains: athlete name, workout name, date, completion %, link to `/athletes/[id]`. Notification function in `src/lib/notifications.ts`. Uses coach email from `Coach` model. Only triggers on transition to `FULLY_COMPLETED` (not on repeated saves). Fire-and-forget with error logging.

- [ ] **Task 18.13**: Add PWA manifest and mobile meta tags for "Add to Home Screen"
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: `public/manifest.json` with name "Cannoli Trainer", short_name "Cannoli", start_url "/athlete", display "standalone", theme_color matching brand orange, icon set (192x192 and 512x512 PNG). Root layout `<head>` includes `<link rel="manifest">`, `<meta name="theme-color">`, `<meta name="apple-mobile-web-app-capable">`, `<link rel="apple-touch-icon">`. Chrome DevTools Application tab shows valid manifest. iOS and Android "Add to Home Screen" works.

- [ ] **Task 18.14**: Seed test athlete with email for auth testing
  - Spec: specs/10-remote-program-delivery.md
  - Acceptance: Seed script creates or updates at least one athlete (Matt Alldian) with a real email address for testing magic link flow. If a `User` record exists for that email, links `Athlete.userId`. Existing seed data not disrupted. Document test email in `.env.example` or seed script comments.
