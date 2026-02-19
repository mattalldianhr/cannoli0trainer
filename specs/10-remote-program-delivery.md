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

### Authentication: NextAuth.js v5 with Email Provider (Magic Link)

**Library**: `next-auth@5` (Auth.js) — the most mature auth library for Next.js, natively supports App Router, middleware, server components, and edge runtime.

**Provider**: Email (magic link) — athletes receive a sign-in link via email, no password needed. This matches the low-friction requirement: athletes tap a link, land in their portal, done.

**Session strategy**: JWT (default in NextAuth v5) — stateless, no session table lookups on every request. The JWT contains `userId`, `email`, and `athleteId` (custom field added via callbacks).

**NextAuth auto-generated tables**: NextAuth v5 with Prisma adapter creates these models automatically:
- `User` — email, name, image, emailVerified
- `Account` — OAuth provider links (unused initially, ready for future Google/Apple SSO)
- `Session` — only used if switching to database sessions later
- `VerificationToken` — stores magic link tokens with expiry

**Linking Athlete to NextAuth User**: Add an optional `userId` field to the existing `Athlete` model:
```prisma
model Athlete {
  // ... existing fields ...
  userId  String? @unique
  user    User?   @relation(fields: [userId], references: [id])
}
```
On first magic-link login, a NextAuth `User` is created. A callback or post-login flow links the `User.id` to `Athlete.userId` by matching on email. If no `Athlete` record exists for that email, the login is rejected (only pre-registered athletes can sign in).

**Auth config file**: `src/lib/auth.ts` exports the NextAuth configuration:
```typescript
import NextAuth from "next-auth"
import Email from "next-auth/providers/email"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Email({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Only allow sign-in if athlete exists with this email
      const athlete = await prisma.athlete.findFirst({
        where: { email: user.email },
      })
      return !!athlete
    },
    async session({ session, token }) {
      // Attach athleteId to session for easy access
      if (token?.athleteId) {
        session.user.athleteId = token.athleteId as string
      }
      return session
    },
    async jwt({ token }) {
      if (token.email) {
        const athlete = await prisma.athlete.findFirst({
          where: { email: token.email },
        })
        if (athlete) {
          token.athleteId = athlete.id
        }
      }
      return token
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/check-email",
    error: "/login",
  },
})
```

### Email Service: Resend

**Library**: `resend` npm package — simple API, generous free tier (100 emails/day, 3,000/month), works natively with NextAuth's Email provider.

**Setup**: Create a Resend account, add and verify the sending domain, get an API key. Set `EMAIL_SERVER` and `EMAIL_FROM` env vars.

**Use cases**:
1. **Magic link emails** — handled automatically by NextAuth Email provider via Resend SMTP
2. **Program assignment notification** — custom email sent when coach assigns a program to an athlete
3. **Workout completion notification** — custom email sent to coach when athlete completes a session

**Custom email templates**: Use Resend's `resend.emails.send()` API for transactional emails beyond auth:
```typescript
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

// Program assignment notification
await resend.emails.send({
  from: 'Cannoli Trainer <notifications@cannoli.mattalldian.com>',
  to: athlete.email,
  subject: `New program assigned: ${program.name}`,
  html: `...` // branded HTML template
})
```

### Route Structure: `/athlete/*` Namespace

All athlete-facing pages live under `/athlete/`:
```
src/app/athlete/
  layout.tsx          — Athlete shell (bottom nav, no coach sidebar)
  page.tsx            — Dashboard (redirect or today's workout)
  login/page.tsx      — Magic link login form
  check-email/page.tsx — "Check your email" confirmation
  train/page.tsx      — Today's workout + set logging (reuses TrainingLog)
  history/page.tsx    — Past workout sessions list
  calendar/page.tsx   — Weekly/monthly calendar view
```

**Athlete layout** (`/athlete/layout.tsx`): Mobile-first shell with:
- Bottom navigation bar (4 tabs): Dashboard, Train, Calendar, History
- No coach sidebar/header — athletes get a simplified, mobile-optimized chrome
- Cannoli Gang branding (logo, colors)
- Session provider wrapper for auth state

### Middleware: Protect `/athlete/*` Routes

**File**: `src/middleware.ts` (Next.js middleware at project root)

```typescript
export { auth as middleware } from "@/lib/auth"

export const config = {
  matcher: ["/athlete/((?!login|check-email).*)"],
}
```

This protects all `/athlete/*` routes except `/athlete/login` and `/athlete/check-email`. Unauthenticated requests redirect to `/login`.

**Coach auth**: Coach authentication uses the same NextAuth magic link flow. The unified login at `/login` auto-detects role from email. Coach routes (`/dashboard`, `/athletes`, `/programs`, `/docs`, `/research`, `/findings`, etc.) are protected by middleware. `getCurrentCoachId()` reads `coachId` from the authenticated session.

### Athlete Portal Views

**Dashboard** (`/athlete/page.tsx`):
- Hero card: today's workout name + program name, or "Rest Day" with next scheduled workout
- Quick stats: streak (consecutive training days), workouts this week, completion rate
- Recent activity: last 3 completed sessions with summary

**Train** (`/athlete/train/page.tsx`):
- Reuses the existing `TrainingLog` component from `src/components/training/TrainingLog.tsx`
- Key difference: no athlete selector dropdown — the athlete is determined by the session
- Props: pass `athleteId` from session instead of showing selector
- The TrainingLog component already handles: exercise display, set logging with RPE/velocity, previous performance reference, workout completion summary
- Minor adaptation needed: add a `mode: 'athlete' | 'coach'` prop to hide/show the athlete picker

**Calendar** (`/athlete/calendar/page.tsx`):
- Weekly view by default (matches gym-goer mental model)
- Days with workouts highlighted, tap to see workout preview
- Month view toggle available
- Data source: `WorkoutSession` records for past, `Workout` records (via ProgramAssignment) for upcoming

**History** (`/athlete/history/page.tsx`):
- Reverse-chronological list of completed `WorkoutSession` records
- Each entry shows: date, workout name, completion %, total volume
- Tap to expand: full exercise list with logged sets
- Infinite scroll or pagination (load 20 at a time)

### Notification System

**Program Assignment** (coach action triggers email to athlete):
- When coach creates a `ProgramAssignment`, fire a server action or API call to send email
- Email contains: program name, start date, link to `/athlete/train`
- Only send if athlete has a verified email

**Workout Completion** (athlete action triggers email to coach):
- When `WorkoutSession.status` changes to `FULLY_COMPLETED`, send email to coach
- Email contains: athlete name, workout name, completion %, date
- Include a link to `/athletes/[id]` for the coach to review

**Implementation**: Server actions in `src/lib/notifications.ts` wrapping Resend API. Called from the training log API routes after successful database updates.

### PWA Manifest

Add `public/manifest.json` for "Add to Home Screen" support:
```json
{
  "name": "Cannoli Trainer",
  "short_name": "Cannoli",
  "start_url": "/athlete",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#f97316",
  "icons": [...]
}
```
Reference in `<head>` via `metadata` export in root layout. No service worker / offline support initially — just the home screen icon and standalone display mode.

### Environment Variables

New env vars required:
```
# NextAuth
AUTH_SECRET=           # `npx auth secret` to generate
AUTH_URL=              # e.g., https://cannoli.mattalldian.com

# Resend (Email)
RESEND_API_KEY=        # From Resend dashboard
EMAIL_SERVER=          # smtp://resend:re_xxx@smtp.resend.com:465
EMAIL_FROM=            # noreply@cannoli.mattalldian.com
```

### Dependencies

New npm packages:
- `next-auth@5` — authentication
- `@auth/prisma-adapter` — NextAuth <-> Prisma bridge
- `resend` — email service SDK

### Future Enhancements (Deferred)
- Coach authentication (same NextAuth setup, role-based routing)
- OAuth providers (Google, Apple) for faster athlete sign-in
- In-app push notifications via service worker
- Offline support (service worker + IndexedDB cache)
- Real-time updates via WebSocket or SSE (coach sees athlete logging live)
- Athlete profile editing (photo, display name, preferences)
- Athlete-to-coach messaging within the app

## Revision History
- 2026-02-18: Major update — added implementation detail for auth (NextAuth v5 + Email provider), email service (Resend), route structure (`/athlete/*` namespace), middleware, athlete portal views (dashboard, train, calendar, history), notification system, PWA manifest, environment variables, and dependencies. Specified TrainingLog component reuse strategy. Deferred coach auth explicitly.
