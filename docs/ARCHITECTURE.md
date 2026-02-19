# Architecture Overview

Cannoli Trainer is a full-stack strength coaching platform built with Next.js, PostgreSQL, and Prisma. It provides separate portals for coaches and athletes with real-time training logs, program management, analytics, and competition tracking.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript 5.9 (strict mode) |
| Database | PostgreSQL |
| ORM | Prisma 5.22 |
| Auth | NextAuth.js 5 (magic link via Resend) |
| UI | Tailwind CSS 4, Radix UI primitives |
| Charts | Recharts 3 |
| Validation | Zod 4 |
| Email | Resend |
| Icons | Lucide React |
| Toasts | Sonner |
| Testing | Vitest (unit/integration), Playwright (e2e) |
| Hosting | Railway (PostgreSQL + Node.js) |

## Application Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # REST API routes
│   ├── dashboard/          # Coach dashboard
│   ├── athletes/           # Athlete management (coach)
│   ├── programs/           # Program builder & templates
│   ├── exercises/          # Exercise library
│   ├── schedule/           # Calendar & scheduling
│   ├── meets/              # Competition tracking
│   ├── analytics/          # Performance analytics
│   ├── settings/           # Coach preferences
│   ├── train/              # Coach training view
│   ├── athlete/            # Athlete portal (login, train, history, calendar)
│   ├── docs/               # Documentation hub (PRD, specs, architecture)
│   ├── research/           # Research articles
│   └── findings/           # Data analysis findings
├── components/
│   ├── ui/                 # Radix + Tailwind design system
│   ├── layout/             # Header, Footer, Container
│   ├── athletes/           # Athlete CRUD components
│   ├── programs/           # Program builder components
│   ├── exercises/          # Exercise management
│   ├── training/           # Training log + rest timer
│   ├── meets/              # Meet tracking + warmup calculator
│   ├── analytics/          # Analytics dashboard
│   ├── charts/             # Recharts wrappers (RPE, velocity, load)
│   ├── schedule/           # Weekly calendar
│   ├── shared/             # RPE selector, reference chart
│   ├── athlete/            # Athlete portal nav
│   ├── research/           # Markdown renderer, TOC
│   └── dashboard/          # Quick action FAB
├── lib/
│   ├── prisma.ts           # Singleton Prisma client
│   ├── auth.ts             # NextAuth config
│   ├── coach.ts            # Coach session helper
│   ├── validations.ts      # Zod schemas
│   ├── scheduling/         # Schedule generation, conflicts, persistence
│   ├── analytics/          # RPE accuracy estimation
│   ├── vbt/                # Velocity-based training (regression, profiles)
│   ├── training/           # Session status updates
│   ├── teambuildr/         # Data import transformer
│   ├── interview/          # Survey flow engine
│   ├── offline-queue.ts    # Offline set logging (localStorage)
│   ├── rpe-table.ts        # RPE/RIR lookup tables
│   ├── email.ts            # Branded email templates
│   ├── notifications.ts    # Coach/athlete notifications
│   ├── toast.ts            # Sonner toast wrapper
│   ├── markdown.ts         # Markdown file reader
│   └── specs.ts            # Spec/PRD file reader
└── hooks/
    └── useInterview.ts     # Interview state management
```

## Database Schema

The database has 15 core models organized around the coaching workflow:

### Auth (NextAuth)
- **User** — authentication identity (email, profile), linked to Coach or Athlete via optional 1:1 relations
- **Account** / **Session** / **VerificationToken** — NextAuth managed

### Coaching Core
- **Coach** — coach profile, settings, notification preferences, timezone, weight units; linked to User via `userId`
- **Athlete** — athlete profile linked to a coach (experience level, federation, bodyweight class, notes); linked to User via `userId`
- **Exercise** — exercise library entries (name, category, equipment, muscles, instructions, video URLs, coaching cues)

### Programming
- **Program** — training program (name, periodization type, individual/template/group, date range)
- **Workout** — abstract workout within a program (week number, day number)
- **WorkoutExercise** — exercise prescription (sets, reps, load, RPE/RIR/velocity targets, tempo, superset grouping, rest period, notes)
- **ProgramAssignment** — links athlete to program with training days configuration

### Training & Logging
- **WorkoutSession** — scheduled workout instance (date, status: not started / partial / complete, completion percentage)
- **SetLog** — individual set performance (reps, weight, RPE, RIR, velocity, timestamp, notes)

### Competition
- **CompetitionMeet** — meet event (date, location, federation, weight class)
- **MeetEntry** — athlete's meet entry (lift attempts, openers, warmup plan)

### Tracking
- **BodyweightLog** — bodyweight measurements over time
- **MaxSnapshot** — historical 1RM records (source: workout, manual, or imported)
- **Notification** — in-app notifications for coaches and athletes

### Key Relationships
```
Coach → Athlete (1:many)
Coach → Program (1:many)
Coach → Exercise (1:many)
Program → Workout → WorkoutExercise → Exercise
Program → ProgramAssignment → Athlete
WorkoutSession → Workout + Athlete
SetLog → WorkoutExercise + Athlete
CompetitionMeet → MeetEntry → Athlete
```

## API Layer

All API routes live under `/api/` and follow RESTful conventions. Every coach-facing endpoint validates coach ownership via `getCurrentCoachId()`.

### Endpoints

| Resource | Routes | Methods |
|---|---|---|
| Athletes | `/api/athletes`, `/api/athletes/[id]` | GET, POST, PUT, DELETE |
| Programs | `/api/programs`, `/api/programs/[id]` | GET, POST, PUT, DELETE |
| Program Assignment | `/api/programs/[id]/assign` | POST |
| Templates | `/api/programs/[id]/template` | GET |
| Exercises | `/api/exercises`, `/api/exercises/[id]` | GET, POST, PUT, DELETE |
| Training | `/api/train` | GET |
| Set Logs | `/api/sets`, `/api/sets/[id]` | GET, POST, PUT, DELETE |
| Exercise Notes | `/api/workout-exercises/[id]/notes` | PUT |
| Schedule | `/api/schedule`, `/api/schedule/[id]/move`, `/api/schedule/[id]/skip` | GET, POST |
| Analytics | `/api/analytics/[athleteId]`, `/api/analytics/compare`, `/api/analytics/[athleteId]/export` | GET |
| Meets | `/api/meets`, `/api/meets/[id]` | GET, POST, PUT, DELETE |
| Meet Entries | `/api/meets/[id]/entries`, `/api/meets/[id]/entries/[entryId]` | GET, POST, PUT, DELETE |
| Bodyweight | `/api/bodyweight`, `/api/bodyweight/[id]` | GET, POST, PUT, DELETE |
| Settings | `/api/settings` | GET, PUT |
| Athlete Portal | `/api/athlete/dashboard`, `/api/athlete/calendar`, `/api/athlete/history` | GET |
| Auth | `/api/auth/[...nextauth]` | GET, POST |
| Health | `/api/health` | GET |

## Authentication

Authentication uses NextAuth.js 5 with a unified passwordless magic link flow for both coaches and athletes:

1. User visits `/` → redirected to `/login` if no session
2. User enters email at `/login` — system auto-detects role from email
3. Resend delivers a magic link to their inbox
4. Clicking the link verifies the token and creates a session
5. JWT session strategy with `athleteId`, `coachId`, and `role` embedded in the token
6. Root page (`/`) redirects based on role: coaches → `/dashboard`, athletes → `/athlete`

### Role Detection
- On sign-in, the JWT callback checks if the email belongs to a Coach or Athlete
- Coach role takes priority if an email matches both (edge case)
- `getCurrentCoachId()` reads `coachId` from the session (with DB fallback during migration)

### Route Protection (Middleware)
- **Public routes**: `/`, `/login`, `/check-email`, `/offline`, `/api/auth`, `/api/health`
- **Coach routes**: `/dashboard`, `/athletes`, `/programs`, `/schedule`, `/exercises`, `/meets`, `/analytics`, `/messages`, `/settings`, `/train`, `/docs`, `/research`, `/findings`, `/interview`, `/submissions`
- **Athlete routes**: `/athlete/*`
- **Role enforcement**: Athletes cannot access coach routes (redirected to `/athlete`), coaches cannot access athlete routes (redirected to `/dashboard`)
- **API protection**: Coach API routes return 403 for athletes, athlete API routes return 403 for coaches, unauthenticated requests return 401

## Data Flow

### Coach → Athlete Training Pipeline

```
Coach creates Program
  → adds Workouts (week/day structure)
    → adds WorkoutExercises (prescriptions: sets × reps @ load/RPE/velocity)
      → assigns Program to Athlete(s) with training day config
        → generateSchedule() creates WorkoutSession records on calendar dates
```

### Athlete Training Session

```
Athlete opens /athlete/train
  → GET /api/train finds today's WorkoutSession
    → Returns prescribed exercises with previous performance
      → Athlete logs sets via POST /api/sets
        → updateSessionStatus() recalculates completion %
          → On completion, notifyWorkoutCompletion() emails coach
```

### Analytics Pipeline

```
SetLogs accumulate as athlete trains
  → Coach views /analytics
    → GET /api/analytics/[athleteId] calculates:
      - RPE accuracy (estimateRPEFromLoad via Tuchscherer table)
      - Velocity trends (buildVelocityProfile with linear regression)
      - Preparedness indicators (calculatePreparedness)
    → Recharts renders line/bar/scatter charts
```

## Specialized Modules

### Velocity-Based Training (VBT)
Located in `src/lib/vbt/`, this module provides:
- **Linear regression** on velocity data points for trend analysis
- **Velocity profile building** from set log history
- **Preparedness indicators** comparing current velocity to baseline
- Load-velocity charts and velocity trend visualizations

### Scheduling Engine
Located in `src/lib/scheduling/`:
- **generateSchedule()** — maps abstract week/day workouts to real calendar dates based on athlete's training days config
- **detectConflicts()** — identifies overlapping program assignments
- **persistSchedule()** — saves generated sessions to the database
- **cleanupAssignment()** — removes assignment and linked sessions

### Offline Support
`src/lib/offline-queue.ts` provides a localStorage-based queue for set logging when the athlete loses connectivity. Sets are queued locally and synced when the connection returns.

### RPE / RIR Reference
`src/lib/rpe-table.ts` implements Tuchscherer's RPE-to-%1RM lookup table. The analytics module uses this in reverse to estimate what RPE an athlete actually hit based on their logged load and reps.

## Infrastructure

### Deployment (Railway)
- PostgreSQL database
- Node.js runtime with `prisma migrate deploy && next start`
- Health check at `/api/health` with 60-second timeout
- Restart on failure with max 10 retries

### Build Pipeline
```
prisma generate → next build
```

### Testing
- **Vitest** — unit and integration tests for scheduling, fitness calculations, RPE estimation, data transformation, API routes
- **Playwright** — e2e smoke tests against running dev server (Chromium)

### Data Import
The `scripts/` directory contains a TeamBuildr export pipeline:
- Fetches athlete workout history from TeamBuildr's API (rate-limited, with checkpoint/resume)
- Transforms data via `src/lib/teambuildr/transformer.ts` into the app's Prisma schema
- Validated by integration tests comparing imported counts to source data

## Design System

The UI layer combines Radix UI primitives with Tailwind CSS:

- **Primitives**: AlertDialog, Popover, Checkbox, RadioGroup, Progress, Separator
- **Custom components**: Button (with variants via CVA), Card, Badge, Input, Label, Textarea, ConfirmDialog, EmptyState, FormError
- **Charts**: BaseLineChart, BaseBarChart, RPEHistoryChart, VelocityTrendChart, LoadVelocityChart, PreparednessIndicator
- **Shared widgets**: RPESelector, RPEWithRIR combo input, RPEReferenceChart
- **Layout**: Header (responsive with mobile drawer), Footer, Container, ConditionalCoachChrome (switches layout between coach and athlete portals)
- **Toasts**: Sonner-based notification system with success/error/loading variants
